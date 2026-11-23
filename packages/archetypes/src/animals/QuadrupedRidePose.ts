import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import type { ArchetypeRideWitness } from "../core/ArchetypeRideWitness";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedJoints } from "./AutoMovieArchetypeQuadrupedJoints";
import type { AutoMovieArchetypeQuadrupedLimb } from "./AutoMovieArchetypeQuadrupedLimb";
import { AutoMovieArchetypeQuadrupedRootRange } from "./AutoMovieArchetypeQuadrupedRootRange";
import { PrepareQuadrupedPose } from "./PrepareQuadrupedPose";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { QuadrupedPelvis } from "./QuadrupedPelvis";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRideTerminal } from "./QuadrupedRideTerminal";
import { QuadrupedScapula } from "./QuadrupedScapula";
import { chooseQuadrupedBodyRoot } from "./chooseQuadrupedBodyRoot";
import type { createQuadruped } from "./createQuadruped";

/** The hind limbs, whose hips ride the pelvis. */
const HINDS: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
  "leftHind",
  "rightHind",
];

/** One sample's unchanged endpoint, relative fold and fixed neutral attachment. */
interface Target {
  /** Chain and terminal-axis binding used for this sample. */
  solver: AutoMovieArchetypeQuadrupedLimb.IOriented;
  /** Terminal endpoint, already including its sole clearance. */
  endpoint: IAutoMovieVector3;
  /** Declared relative carpus/hock fold, degrees. */
  fold: number;
  /** Proximal joint before the common body-root displacement. */
  attachment: IAutoMovieVector3;
  /** A fore limb's shoulder blade. */
  blade?: QuadrupedScapula.Bone;
  /** The root constraint this target yields, read again once the root is chosen. */
  constraint: AutoMovieArchetypeQuadrupedRootRange.IConstraint;
}

/**
 * Fixed-attachment locomotion lowered through the animal's shared rig.
 */
export namespace QuadrupedRidePose {
  /**
   * A terminal footprint and positive surface clearance above its local floor.
   */
  export interface IGoal {
    /** Terminal endpoint's lateral coordinate in model space, metres. Defaults to its attachment's sagittal plane. */
    x?: number;
    /** Terminal endpoint's forward coordinate in model space, metres. */
    z: number;
    /** Model-space rotation of the terminal's neutral axis. Defaults to its neutral model-space direction. */
    orientation?: IAutoMovieQuaternion;
    /** Optional local landing plane. Defaults to the nominal model floor. */
    surface?: AutoMovieArchetypeQuadrupedFooting.ISurface;
    /** Exact terminal solid clearance normal to its support surface, nonnegative metres. */
    lift: number;
    /** Relative carpus/hock fold beyond the neutral angle, degrees. */
    fold: number;
    /** The share of a stance's load the hoof bears, 0 to 1 (`AutoMovieArchetypeQuadrupedRootRange.IConstraint.load`); one, planted, when absent. */
    load?: number;
  }

  /**
   * One prepared model, reused by independent time samples.
   */
  export interface IPrepared<Id extends string, Dimension extends string> {
    /**
     * Emit all four exact chains under one physically feasible body root.
     */
    sample: (
      goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
      witness?: ArchetypeRideWitness.Witness,
    ) => AutoMovieArchetype<Id, Dimension>;
  }

  /**
   * Prepare lengths, terminal solids, carrier policy and shared FK once.
   *
   * @param animal The neutral model, never changed by preparation or sampling.
   * @param species Declared carriage selectors of this ride's producer.
   * @param source Admitted independent joints and attachments read from that same model.
   * @returns A sampler retaining no caller-owned goal or returned-frame state.
   * @throws {RangeError} For unsupported terminal solids, malformed neutral chains/carriers or physically incompatible current goals.
   */
  export function prepare<Id extends string, Dimension extends string>(
    animal: AutoMovieArchetype<Id, Dimension>,
    species: createQuadruped.ISpecies,
    source: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read>,
    nativeCourse: boolean,
  ): IPrepared<Id, Dimension> {
    const bindings: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, species);
    const pose: PrepareQuadrupedPose.IPrepared<Id, Dimension> =
      PrepareQuadrupedPose.ride(
        animal,
        bindings.parts,
        bindings.contacts,
        nativeCourse,
      );
    const neutral: QuadrupedPosePlan.IState = pose.read();
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const end = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): QuadrupedRideTerminal.Binding =>
      QuadrupedRideTerminal.of(
        limb,
        source.limbs[limb],
        parts.get(AutoMovieArchetypeQuadrupedBody.BONES[limb][3]!),
      );
    const ends: Readonly<
      Record<
        AutoMovieArchetypeQuadrupedBody.Limb,
        QuadrupedRideTerminal.Binding
      >
    > = {
      leftFore: end("leftFore"),
      rightFore: end("rightFore"),
      leftHind: end("leftHind"),
      rightHind: end("rightHind"),
    };
    const sourceScale: number = Math.max(
      1,
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): number[] =>
          source.limbs[limb].flatMap((point: IAutoMovieVector3): number[] => [
            Math.abs(point.x),
            Math.abs(point.y),
            Math.abs(point.z),
          ]),
      ),
    );
    const limbBones: Set<string> = new Set(
      AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
        ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
          ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
        ],
      ),
    );
    /** Identity of the private chain workspaces and admitted rig in this prepared source. */
    const geometryOwner: object = {};
    return { sample };

    /** Achieve four unchanged foot poses with one explicit whole-body trajectory. */
    function sample(
      goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
      witness?: ArchetypeRideWitness.Witness,
    ): AutoMovieArchetype<Id, Dimension> {
      if (!Number.isFinite(nod))
        throw new RangeError("The quadruped head nod must be finite degrees");
      const axial: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
        new Map([
          [
            "neck",
            {
              kind: "rotation",
              rotation: Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, nod),
                neutral.frames.get("neck")!.rotation,
              ),
            },
          ],
        ]);
      const preview: QuadrupedPosePlan.IState = pose.read(undefined, axial);
      const targets: Map<AutoMovieArchetypeQuadrupedBody.Limb, Target> =
        new Map();
      const constraints: Readonly<
        Record<
          AutoMovieArchetypeQuadrupedBody.Limb,
          AutoMovieArchetypeQuadrupedRootRange.IConstraint
        >
      > = {
        leftFore: constraint("leftFore"),
        rightFore: constraint("rightFore"),
        leftHind: constraint("leftHind"),
        rightHind: constraint("rightHind"),
      };
      // Spans and any old source effects remain live on every call. Only the
      // geometry following this floor observation can share exact work.
      const floor: number = -pose.bodyFloor(preview.frames);
      const coordinateScale: number = Math.max(
        sourceScale,
        ...[...targets.values()].flatMap((target: Target): number[] => [
          Math.abs(target.endpoint.x),
          Math.abs(target.endpoint.y),
          Math.abs(target.endpoint.z),
        ]),
      );
      // A swinging limb unfolds only as far as the common root requires, keeping twice the root chooser's roundoff erosion of reach.
      const settled: AutoMovieArchetypeQuadrupedRootRange.IRelaxed =
        AutoMovieArchetypeQuadrupedRootRange.relax(
          constraints,
          floor,
          (
            limb: AutoMovieArchetypeQuadrupedBody.Limb,
            fold: number,
          ): AutoMovieArchetypeQuadrupedLimb.IRange =>
            targets.get(limb)!.solver.range(fold),
          512 * Number.EPSILON * Math.max(1, coordinateScale, Math.abs(floor)),
        );
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const target: Target = targets.get(limb)!;
        target.constraint = settled.constraints[limb];
        target.fold = target.constraint.fold ?? target.fold;
      }
      const range: AutoMovieArchetypeQuadrupedRootRange.IRange = settled.range;
      /** Solve the shared-root limbs and prove their canonical FK. */
      const geometry = (): ReturnType<typeof pose.position> => {
        const height: number = chooseQuadrupedBodyRoot(
          range,
          preferredRoot,
          coordinateScale,
        );
        const root: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
          x: 0,
          y: height,
          z: 0,
        });
        const solved: Map<
          AutoMovieArchetypeQuadrupedBody.Limb,
          readonly IAutoMovieVector3[]
        > = new Map();
        const turned: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
          new Map(axial);
        // Both hips ride one pelvis, turned as far as the hind needing it most requires.
        const pelvis: number = QuadrupedPelvis.turn(
          HINDS.map(
            (
              limb: AutoMovieArchetypeQuadrupedBody.Limb,
            ): QuadrupedPelvis.IHip => {
              const constraint: AutoMovieArchetypeQuadrupedRootRange.IConstraint =
                targets.get(limb)!.constraint;
              return {
                joint: constraint.pelvis!,
                goal: constraint.goal,
                reach: constraint.reach,
              };
            },
          ),
          height,
          256 * Number.EPSILON * coordinateScale,
        );
        if (pelvis !== 0)
          turned.set(QuadrupedPelvis.BONE, bar(QuadrupedPelvis.BONE, pelvis));
        for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
          const target: Target = targets.get(limb)!;
          const hip: QuadrupedScapula.IJoint | undefined =
            target.constraint.pelvis;
          const attachment: IAutoMovieVector3 =
            hip === undefined
              ? shoulder(target, height, turned)
              : QuadrupedScapula.glenoid(hip, pelvis);
          const joint: IAutoMovieVector3 = {
            ...attachment,
            y: attachment.y + height,
          };
          solved.set(
            limb,
            target.solver.solve(joint, short(target, joint), target.fold),
          );
        }
        return pose.position(solved, root, turned);
      };

      /**
       * A swinging hoof's endpoint where its leg reaches at the chosen root: its goal where the leg reaches it, otherwise raised under the joint (its forward place kept, or drawn in as far as the leg's reach requires) until the leg just reaches, as a swinging foot adapts to the body the planted ones carry. A loaded hoof keeps its goal: its leg's reach capped the root.
       */
      function short(target: Target, joint: IAutoMovieVector3): IAutoMovieVector3 {
        if ((target.constraint.load ?? 1) >= 1) return target.endpoint;
        const goal: IAutoMovieVector3 = target.constraint.goal;
        const reach: number =
          target.constraint.reach.maximum -
          512 * Number.EPSILON * Math.max(1, coordinateScale);
        const dx: number = goal.x - joint.x;
        const dy: number = goal.y - joint.y;
        const dz: number = goal.z - joint.z;
        if (Math.hypot(dx, dy, dz) <= reach) return target.endpoint;
        const across: number = Math.max(0, reach * reach - dx * dx);
        const forward: number =
          dz * dz <= across ? dz : Math.sign(dz) * Math.sqrt(across);
        const down: number = -Math.sqrt(Math.max(0, across - forward * forward));
        return {
          x: target.endpoint.x,
          y: target.endpoint.y + (down - dy),
          z: target.endpoint.z + (forward - dz),
        };
      }
      const prepared: ReturnType<typeof geometry> =
        witness === undefined
          ? geometry()
          : witness.geometry(
              geometryOwner,
              [
                nod,
                preferredRoot,
                floor,
                coordinateScale,
                ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
                  (limb: AutoMovieArchetypeQuadrupedBody.Limb): number[] => [
                    goals[limb].orientation === undefined &&
                    goals[limb].x === undefined
                      ? 0
                      : 1,
                    targets.get(limb)!.endpoint.x,
                    goals[limb].z,
                    goals[limb].surface === undefined
                      ? goals[limb].lift
                      : targets.get(limb)!.endpoint.y,
                    goals[limb].fold,
                    goals[limb].load ?? 1,
                    goals[limb].orientation?.x ?? 0,
                    goals[limb].orientation?.y ?? 0,
                    goals[limb].orientation?.z ?? 0,
                    goals[limb].orientation?.w ?? 1,
                  ],
                ),
              ],
              geometry,
            );
      // Current metadata, model/carrier emission and the final solid floor
      // check always execute, even when the admitted numerical geometry matches.
      const result: AutoMovieArchetype<Id, Dimension> = prepared.emit(
        witness?.ode,
      );

      // Terminal support alone cannot admit an elbow or folded lower bar
      // below the same floor. Verify those solids after exact FK.
      const roundoff: number = 256 * Number.EPSILON * coordinateScale;
      for (const part of result.parts)
        if (goals.leftFore.surface === undefined && limbBones.has(part.id)) {
          const lowest: number = QuadrupedRestFloor(part);
          if (!Number.isFinite(lowest) || lowest < -roundoff)
            throw new RangeError(
              `Quadruped ${part.id} penetrates its local floor by ${-lowest} m`,
            );
        }
      return result;

      /** A fore limb's shoulder joint at the chosen root: its blade turns only as far as reach needs, and the turn joins the axial goals. */
      function shoulder(
        target: Target,
        height: number,
        turned: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
      ): IAutoMovieVector3 {
        const joint: QuadrupedScapula.IJoint | undefined =
          target.constraint.scapula;
        const blade: QuadrupedScapula.Bone | undefined = target.blade;
        if (joint === undefined || blade === undefined)
          return target.attachment;
        const angle: number = QuadrupedScapula.least(
          joint,
          target.constraint.goal,
          target.constraint.reach,
          height,
          256 * Number.EPSILON * coordinateScale,
        );
        if (angle === 0) return target.attachment;
        turned.set(blade, bar(blade, angle));
        return QuadrupedScapula.glenoid(joint, angle);
      }

      /** An axial bar's goal turned by an angle about model X from its previewed direction. */
      function bar(
        bone: QuadrupedPosePlan.Axial,
        angle: number,
      ): QuadrupedPosePlan.Goal {
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          preview.frames.get(bone)!.rotation,
          { x: 0, y: 1, z: 0 },
        );
        return {
          kind: "direction",
          direction: {
            x: axis.x,
            y: axis.y * Math.cos(angle) - axis.z * Math.sin(angle),
            z: axis.y * Math.sin(angle) + axis.z * Math.cos(angle),
          },
        };
      }

      /** Convert one solid's lift to an exact endpoint/ankle constraint. */
      function constraint(
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
      ): AutoMovieArchetypeQuadrupedRootRange.IConstraint {
        const goal: IGoal | undefined = goals?.[limb];
        if (
          goal === undefined ||
          goal === null ||
          ![goal.x ?? 0, goal.z, goal.lift, goal.fold].every(Number.isFinite) ||
          goal.lift < 0
        )
          throw new RangeError(
            `The ${limb} footprint goal must be finite with nonnegative lift`,
          );
        const attachment: IAutoMovieVector3 = preview.frames.get(
          AutoMovieArchetypeQuadrupedBody.BONES[limb][0]!,
        )!.translation;
        const surface: AutoMovieArchetypeQuadrupedFooting.ISurface | undefined =
          goal.surface;
        const normal: IAutoMovieVector3 | undefined = surface?.normal;
        const support: QuadrupedRideTerminal.IEnd = ends[limb](
          goal.orientation,
          goal.x !== undefined,
          normal,
        );
        const x: number = goal.x ?? attachment.x;
        const offset: number = goal.lift + support.clearance;
        let endpoint: IAutoMovieVector3 = { x, y: offset, z: goal.z };
        if (surface !== undefined) {
          const { normal, point } = surface;
          if (!(normal.y > 0 && Number.isFinite(point.y)))
            throw new RangeError(`The ${limb} support plane faces down`);
          const run: number =
            normal.x * (x - point.x) + normal.z * (goal.z - point.z);
          endpoint = Vector3.addScaled(
            { x, y: point.y - run / normal.y, z: goal.z },
            normal,
            offset,
          );
        }
        const blade: QuadrupedScapula.Bone | undefined =
          limb === "leftFore" || limb === "rightFore"
            ? QuadrupedScapula.BONES[limb]
            : undefined;
        const result: AutoMovieArchetypeQuadrupedRootRange.IConstraint = {
          attachment,
          goal: support.solver.target(endpoint),
          reach: support.solver.range(goal.fold),
          fold: goal.fold,
          ...(goal.load === undefined ? {} : { load: goal.load }),
          ...(blade === undefined
            ? {
                pelvis: {
                  pivot: preview.frames.get(QuadrupedPelvis.BONE)!.translation,
                  glenoid: attachment,
                },
              }
            : {
                scapula: {
                  pivot: preview.frames.get(blade)!.translation,
                  glenoid: attachment,
                },
              }),
        };
        targets.set(limb, {
          endpoint,
          fold: goal.fold,
          attachment,
          solver: support.solver,
          ...(blade === undefined ? {} : { blade }),
          constraint: result,
        });
        return result;
      }
    }
  }
}
