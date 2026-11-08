import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIkInput as Input } from "./AutoMovieHumanClinicalIkInput";
import { AutoMovieHumanClinicalIkMath as IkMath } from "./AutoMovieHumanClinicalIkMath";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { solveAutoMovieHumanClinicalIkGroups as solveGroups } from "./solveAutoMovieHumanClinicalIkGroups";

/** World-space Human ankle/hand-effector goals with analytic hinge seeding and explicit synchronized clinical fitting. */
export namespace AutoMovieHumanLimbIk {
  /** Literal world target and an optional second anatomical witness. */
  export interface IGoal {
    /** Ankle or hand-effector centre in world metres. */ point: Controls.MetrePoint;
    /** Secondary aim, fitted without blocking primary convergence. */ aim?: {
      /** Mid-metatarsal, tibial or elbow landmark. */ bone:
        | "ball"
        | "knee"
        | "elbow";
      /** Desired world metres. */ point: Controls.MetrePoint;
      /** Positive residual multiplier. */ weight: number;
    };
  }
  /** One self-contained stateless fitting request. */
  export interface IRequest {
    /** Independent authored clinical channels used for regularization. */ pose: IAutoMovieHumanPose;
    /** Evaluator-frame origin in world metres and a unit world rotation. */ root: {
      /** World metres. */ position: Controls.MetrePoint;
      /** Unit quaternion. */ rotation: Controls.Rotation;
    };
    /** Ankle goals; absent limbs preserve authored channels. */ legs?: Partial<
      Record<Controls.Side, IGoal>
    >;
    /** Hand-effector goals; absent limbs preserve authored channels. */ arms?: Partial<
      Record<Controls.Side, IGoal>
    >;
    /** Held or worn hand-effector extension beyond the wrist along the actual forearm ray, metres; defaults to zero. */ handOffset?: number;
    /** Optional degree intervals narrower than clinical ROM, keyed by canonical channel. */ limits?: Partial<
      Record<
        Controls.DegreeChannel,
        {
          /** Inclusive degrees. */ minimum: number;
          /** Inclusive degrees. */ maximum: number;
        }
      >
    >;
    /** Explicit symmetric reference side for reproducing older symmetric seeds; omission measures each limb itself. */ symmetricSeedSide?: Controls.Side;
    /** Metres per degree of authored-pose regularization, nonnegative; defaults to 0.0006. */ priorWeight?: number;
  }
  /** Compile one fixed body's neutral lengths; no generated skin or previous solve is retained. */
  export function prepare(
    evaluate: Skeleton.PoseEvaluator,
  ): (request: IRequest) => solveGroups.IResult {
    const neutral: Map<string, Skeleton.IPlacement> = new Map(
      evaluate({}).posed.map(
        (item: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
          item.bone,
          item,
        ],
      ),
    );
    return (request: IRequest): solveGroups.IResult => {
      const admitted: ReturnType<typeof AutoMovieHumanStateAdmission.root> =
        AutoMovieHumanStateAdmission.root({
          translation: request.root.position,
          rotation: request.root.rotation,
        });
      if (
        Math.abs(Math.hypot(...request.root.rotation) - 1) > 1e-6 ||
        !Number.isFinite(request.handOffset ?? 0) ||
        (request.handOffset ?? 0) < 0 ||
        (request.symmetricSeedSide !== undefined &&
          !["left", "right"].includes(request.symmetricSeedSide))
      )
        throw new Error(
          "Invalid Human limb root, hand-effector extent or symmetric seed side",
        );
      const pose: IAutoMovieHumanPose = AutoMovieHumanStateAdmission.pose(
        request.pose,
      );
      const inverse: Math3D.Quaternion = [
        -request.root.rotation[0],
        -request.root.rotation[1],
        -request.root.rotation[2],
        request.root.rotation[3],
      ];
      const original: Map<string, Skeleton.IPlacement> = new Map(
        evaluate(pose).posed.map(
          (item: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
            item.bone,
            item,
          ],
        ),
      );
      const groups: Input.IRequest[] = [];
      for (const side of ["left", "right"] as const)
        for (const kind of ["legs", "arms"] as const) {
          const goal: IGoal | undefined = request[kind]?.[side];
          if (!goal) continue;
          const leg: boolean = kind === "legs";
          const end: Controls.Joint = Controls.joint(
            `${side}${leg ? "Foot" : "Hand"}`,
          );
          const targets: Input.ITarget[] = [
            {
              bone: end,
              position: local(goal.point),
              ...(!leg && (request.handOffset ?? 0) > 0
                ? {
                    witness: {
                      kind: "ray" as const,
                      from: Controls.joint(`${side}LowerArm`),
                      distance: request.handOffset!,
                    },
                  }
                : {}),
            },
          ];
          if (goal.aim) {
            if (!(leg ? ["ball", "knee"] : ["elbow"]).includes(goal.aim.bone))
              throw new Error(
                "Human limb aim belongs to another anatomical chain",
              );
            targets.push({
              bone: Controls.joint(
                `${side}${goal.aim.bone === "ball" ? "HalluxProximal" : goal.aim.bone === "knee" ? "LowerLeg" : "LowerArm"}`,
              ),
              position: local(goal.aim.point),
              weight: goal.aim.weight,
              preference: true,
              ...(goal.aim.bone === "ball"
                ? {
                    witness: {
                      kind: "blend" as const,
                      other: Controls.joint(`${side}Toe5Proximal`),
                      weight: 0.5,
                    },
                  }
                : {}),
            });
          }
          const names: string[] = leg
            ? [
                "hip.flexion",
                "hip.abduction",
                "hip.rotation",
                "knee.flexion",
                "ankle.dorsiflexion",
              ]
            : [
                "shoulder.flexion",
                "shoulder.abduction",
                "shoulder.rotation",
                "elbow.flexion",
              ];
          const channels: Controls.DegreeChannel[] = names.map(
            (name: string): Controls.DegreeChannel =>
              Controls.channel(`${kind}.${side}.${name}`),
          );
          const constraints: Input.IConstraint[] = channels.flatMap(
            (channel: Controls.DegreeChannel): Input.IConstraint[] =>
              request.limits?.[channel]
                ? [{ kind: "channel", channel, ...request.limits[channel]! }]
                : [],
          );
          const reference: Controls.Side = request.symmetricSeedSide ?? side;
          const root: string = `${side}${leg ? "UpperLeg" : "UpperArm"}`;
          const neutralRoot: string = `${reference}${leg ? "UpperLeg" : "UpperArm"}`;
          const middle: string = `${reference}${leg ? "LowerLeg" : "LowerArm"}`;
          const neutralEnd: string = `${reference}${leg ? "Foot" : "Hand"}`;
          const a: number = distance(
            neutral.get(neutralRoot)!.position,
            neutral.get(middle)!.position,
          );
          const b: number =
            distance(
              neutral.get(middle)!.position,
              neutral.get(neutralEnd)!.position,
            ) + (leg ? 0 : (request.handOffset ?? 0));
          const d: number = Math.min(
            a + b - 0.0001,
            Math.max(
              Math.abs(a - b) + 0.0001,
              distance(original.get(root)!.position, targets[0]!.position),
            ),
          );
          const flexion: number =
            180 -
            (Math.acos((a * a + b * b - d * d) / (2 * a * b)) * 180) / Math.PI;
          IkMath.write(pose, channels[3]!, flexion);
          groups.push({
            channels,
            targets,
            constraints,
            priorPose: request.pose,
            priorWeight: request.priorWeight ?? 0.0006,
          });
        }
      if (groups.length === 0)
        return { pose, output: evaluate(pose), error: 0, iterations: 0 };
      return solveGroups(evaluate, pose, { groups });

      /** Validate literal world coordinates before applying the borrowed actor frame. */
      function local(point: Controls.MetrePoint): Controls.MetrePoint {
        if (!IkMath.finitePoint(point))
          throw new Error("Human limb goal requires finite world metres");
        return Math3D.rotate(inverse, Math3D.sub(point, admitted.translation));
      }
    };
  }
}

/** Same-frame Euclidean distance; neutral anatomy and authored root are never mixed. */
function distance(a: Controls.MetrePoint, b: Controls.MetrePoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
