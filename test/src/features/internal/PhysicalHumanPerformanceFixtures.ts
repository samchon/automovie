import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMovieHumanClinicalIk as Ik } from "../../../../packages/human/src/skeleton/AutoMovieHumanClinicalIk";
import { AutoMovieHumanRigControls as Controls } from "../../../../packages/human/src/skeleton/AutoMovieHumanRigControls";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { PhysicalHumanFixtures } from "./PhysicalHumanFixtures";
import { PhysicalPerformanceFixtures as Performance } from "./PhysicalPerformanceFixtures";

/** Actual Human clinical IK feeds the same generic planner and physical tracking consumer as engine models. */
export namespace PhysicalHumanPerformanceFixtures {
  /** Bake a slow clinical walk with ankle/ball goals carried by the person's own FK. */
  export function walk(
    person: ReturnType<typeof PhysicalHumanFixtures.get>,
    duration: number,
  ): ReturnType<typeof Performance.walk> & { clinicalResidual: number } {
    const result: ReturnType<typeof Performance.walk> = Performance.walk(
      person.profile,
      duration,
      0.25,
    );
    const neutral: ReturnType<typeof person.evaluate> = person.evaluate({});
    const points: Map<string, IAutoMovieVector3> = new Map(
      neutral.posed.map(
        (
          placement: (typeof neutral.posed)[number],
        ): [string, IAutoMovieVector3] => [
          placement.bone,
          {
            x: placement.position[0],
            y: placement.position[1],
            z: placement.position[2],
          },
        ],
      ),
    );
    const legLength: number =
      Vector3.length(
        Vector3.subtract(
          points.get("leftLowerLeg")!,
          points.get("leftUpperLeg")!,
        ),
      ) +
      Vector3.length(
        Vector3.subtract(points.get("leftFoot")!, points.get("leftLowerLeg")!),
      );
    const drop: number = legLength * (1 - Math.cos((8 * Math.PI) / 180));
    const channels: Controls.DegreeChannel[] = (
      ["left", "right"] as const
    ).flatMap((side: "left" | "right"): Controls.DegreeChannel[] =>
      [
        "hip.flexion",
        "hip.abduction",
        "hip.rotation",
        "knee.flexion",
        "ankle.dorsiflexion",
      ].map(
        (joint: string): Controls.DegreeChannel =>
          Controls.channel(`legs.${side}.${joint}`),
      ),
    );
    let seed: IAutoMovieHumanPose = {
      arms: {
        left: { shoulder: { flexion: 55 }, elbow: { flexion: 100 } },
        right: { shoulder: { flexion: 55 }, elbow: { flexion: 100 } },
      },
      legs: {
        left: {
          hip: { flexion: 8 },
          knee: { flexion: 16 },
          ankle: { dorsiflexion: 8 },
        },
        right: {
          hip: { flexion: 8 },
          knee: { flexion: 16 },
          ankle: { dorsiflexion: 8 },
        },
      },
    };
    let clinicalResidual: number = 0;
    for (const [step, target] of result.body.targets.entries()) {
      const seconds: number = step / 120;
      const root: IAutoMovieVector3 = { x: seconds * 0.12, y: -drop, z: 0 };
      const goals: Ik.ITarget[] = [];
      for (const side of ["left", "right"] as const) {
        const bone: string = `${side}Midfoot`;
        const placement: ReturnType<typeof result.planner.at>["placement"] =
          result.planner.at(bone, seconds).placement;
        const support: IAutoMovieVector3 = {
          x: placement.point[0],
          y: points.get(bone)!.y + placement.clearance,
          z: placement.point[1],
        };
        // Positive planner pitch lifts the heel, rotating the +X toes down.
        const rotate: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
          { x: 0, y: 0, z: 1 },
          (-placement.pitch * 180) / Math.PI,
        );
        const ball: IAutoMovieVector3 = Vector3.scale(
          Vector3.add(
            points.get(`${side}HalluxProximal`)!,
            points.get(`${side}Toe5Proximal`)!,
          ),
          0.5,
        );
        const ankleGoal: IAutoMovieVector3 = local(points.get(`${side}Foot`)!);
        const ballGoal: IAutoMovieVector3 = local(ball);
        goals.push(
          {
            bone: Controls.joint(`${side}Foot`),
            position: [ankleGoal.x, ankleGoal.y, ankleGoal.z],
          },
          {
            bone: Controls.joint(`${side}HalluxProximal`),
            witness: {
              kind: "blend",
              other: Controls.joint(`${side}Toe5Proximal`),
              weight: 0.5,
            },
            position: [ballGoal.x, ballGoal.y, ballGoal.z],
            weight: 0.7,
          },
        );

        /** Map the independently scheduled support frame into evaluator metres. */
        function local(point: IAutoMovieVector3): IAutoMovieVector3 {
          return Vector3.subtract(
            Vector3.add(
              support,
              Quaternion.rotateVector(
                rotate,
                Vector3.subtract(point, points.get(bone)!),
              ),
            ),
            root,
          );
        }
      }
      const fitted: Ik.IResult = Ik.solve(person.evaluate, seed, {
        channels,
        targets: goals,
        iterations: 8,
        tolerance: 0.001,
        priorWeight: 0.0001,
      });
      clinicalResidual = Math.max(clinicalResidual, fitted.error);
      seed = fitted.pose;
      const poses: Map<string, (typeof fitted.output.posed)[number]> = new Map(
        fitted.output.posed.map(
          (
            pose: (typeof fitted.output.posed)[number],
          ): [string, typeof pose] => [pose.bone, pose],
        ),
      );
      target.segments = Object.fromEntries(
        person.profile.segments.map(
          (
            segment: (typeof person.profile.segments)[number],
          ): [string, P.ITransform] => {
            const pose: (typeof fitted.output.posed)[number] = poses.get(
              segment.bone,
            )!;
            return [
              segment.bone,
              {
                position: Vector3.add(
                  {
                    x: pose.position[0],
                    y: pose.position[1],
                    z: pose.position[2],
                  },
                  root,
                ),
                rotation: {
                  x: pose.rotation[0],
                  y: pose.rotation[1],
                  z: pose.rotation[2],
                  w: pose.rotation[3],
                },
              },
            ];
          },
        ),
      );
    }
    return { ...result, clinicalResidual };
  }
}
