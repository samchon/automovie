import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import type { ArchetypeRideWitness } from "../core/ArchetypeRideWitness";
import { PrepareQuadrupedPose } from "./PrepareQuadrupedPose";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import type { QuadrupedJoints } from "./QuadrupedJoints";
import { QuadrupedLimb } from "./QuadrupedLimb";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRootRange } from "./QuadrupedRootRange";
import { chooseQuadrupedBodyRoot } from "./chooseQuadrupedBodyRoot";
import type { createQuadruped } from "./createQuadruped";

/** One admitted terminal primitive and its exact fixed-orientation sole offset. */
interface End {
  /** Actual chain with its terminal direction constrained by a pose goal. */
  solver: QuadrupedLimb.IOriented;
  /** Endpoint height above the terminal primitive's lowest surface, metres. */
  clearance: number;
}

/** One sample's unchanged endpoint, relative fold and fixed neutral attachment. */
interface Target {
  /** Actual chain and terminal-axis binding used for this sample. */
  solver: QuadrupedLimb.IOriented;
  /** Actual terminal endpoint, already including its sole clearance. */
  endpoint: IAutoMovieVector3;
  /** Declared relative carpus/hock fold, degrees. */
  fold: number;
  /** Actual proximal joint before the common body-root displacement. */
  attachment: IAutoMovieVector3;
}

/**
 * Fixed-attachment locomotion lowered through the actual animal's shared rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates unchanged foot goals, actual terminal shape/orientation, one constrained body-root trajectory, source-carried accessories and actual generic-FK emission.
 * @evidence contracts/development/design.md#principled-representation Four declared foot targets constrain the same body root, while actual source lengths and parent-local attachments define every solved limb.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Internal to the shared ride; course timing, body construction, exact limb mathematics, physical support and generic FK keep their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No detached proximal joint, stretched bone, endpoint-only floor assumption, species branch, prior-frame cache or implicit anatomical limit is represented.
 */
export namespace QuadrupedRidePose {
  /**
   * A terminal footprint and positive surface clearance above its local floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines model-space forward metres, sole lift and relative fold degrees; terminal geometry supplies its own endpoint offset.
   * @evidence contracts/development/design.md#principled-representation The goal contains authored position/clearance and joint fold, without allowing a per-limb root shift or a changed segment length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These three values are already computed by the ride's stance/swing law and consumed only by pose emission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A terminal centre is not mislabeled as its sole, and no implementation tolerance or fitted attachment is exposed as an authoring knob.
   */
  export interface IGoal {
    /** Terminal endpoint's lateral coordinate in model space, metres. Defaults to its attachment's sagittal plane. */
    x?: number;
    /** Terminal endpoint's forward coordinate in model space, metres. */
    z: number;
    /** Model-space rotation of the terminal's neutral axis. Defaults to its neutral model-space direction. */
    orientation?: IAutoMovieQuaternion;
    /** Optional actual local landing plane. Defaults to the nominal model floor. */
    surface?: QuadrupedFooting.ISurface;
    /** Exact terminal solid clearance normal to its support surface, nonnegative metres. */
    lift: number;
    /** Relative carpus/hock fold beyond the actual neutral angle, degrees. */
    fold: number;
  }

  /**
   * One prepared actual model, reused by independent time samples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States independent four-goal samples, degree head nod and soft vertical preference, returning actual root-included model geometry.
   * @evidence contracts/development/design.md#principled-representation A function of complete current goals emits a complete model through one fixed skeleton; no mutable previous-frame state is required.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the sample operation is exposed to rideQuadruped; prepared body/foot/FK data remain private.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The operation cannot request separate limb roots or bypass exact shape/attachment admission.
   */
  export interface IPrepared<Id extends string, Dimension extends string> {
    /**
     * Emit all four exact chains under one physically feasible body root.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Inputs are current model-space goals, nod degrees and the gait's soft root preference; returned model already includes the chosen root and preserves source contact identities.
     * @evidence contracts/development/implementation.md#principled-implementation Preview current axial frames, intersect actual four-limb reach with exact body-floor support, select one root and solve every terminal pose before generic FK must reproduce all five joints per limb.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Current head carriage, four endpoint constraints, shared root, four exact solves and one prepared FK emission form one stateless sample.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither goals nor attachments move independently; impossible intersections refuse. Terminal orientation and actual primitive support prevent a planted endpoint from concealing surface penetration.
     * @evidence contracts/development/implementation.md#efficient-algorithms Uses two O(B) FK evaluations, exact support over P body parts, four constant-size intersections/closed-form solves and one O(P+A+V) independent model emission; no physical simulation or iterative IK is introduced.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses prepared source chains, oriented terminal solvers, scalar clearances, carrier maps and the actual rig reader for every sample.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Current targets, ranges and solved points are call-local; the prepared owner retains only its bounded source data and no completed pose history or external resource.
     */
    sample: (
      goals: Readonly<Record<QuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
      witness?: ArchetypeRideWitness.Witness,
    ) => Archetype<Id, Dimension>;
  }

  /**
   * Prepare actual lengths, terminal solids, carrier policy and shared FK once.
   *
   * @param animal The actual neutral model, never changed by preparation or sampling.
   * @param species Declared carriage selectors of this ride's producer.
   * @param source Admitted independent joints and attachments read from that same actual model.
   * @returns A sampler retaining no caller-owned goal or returned-frame state.
   * @throws {RangeError} For unsupported terminal solids, malformed neutral chains/carriers or physically incompatible current goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual-source identity, one-time preparation, fixed terminal orientation, exact cylinder/capsule support and root-included independent output.
   * @evidence contracts/development/implementation.md#principled-implementation Preserve each actual terminal axis and derive its exact lowest-surface endpoint offset along the support normal before the oriented four-link solve. The same source geometry supplies neutral parent frames and shared rigid FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare complete carriage, actual pose state and four terminal solvers, then close over only that immutable source context.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source geometry is never reconstructed from a species table, terminal radius is not ignored and the gait's bob is explicitly a soft whole-body preference rather than a hidden hard-path clamp.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation indexes P actual parts, reads twenty limb points and prepares the B-bone rig once; each sample has linear actual-model work and four fixed-size closed-form solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing carriage, joint admission, exact limb, primitive support, common root intersection and generic pose owners supply their respective operations without duplicated solver mathematics.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains bounded independent source/FK metadata, four solvers and scalar clearances; no clock, renderer, process, global cache or prior sample survives.
   */
  export function prepare<Id extends string, Dimension extends string>(
    animal: Archetype<Id, Dimension>,
    species: createQuadruped.ISpecies,
    source: ReturnType<typeof QuadrupedJoints.read>,
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
    const ends: Readonly<
      Record<
        QuadrupedBody.Limb,
        (
          orientation: IAutoMovieQuaternion | undefined,
          lateral: boolean,
          normal?: IAutoMovieVector3,
        ) => End
      >
    > = {
      leftFore: end("leftFore"),
      rightFore: end("rightFore"),
      leftHind: end("leftHind"),
      rightHind: end("rightHind"),
    };
    const sourceScale: number = Math.max(
      1,
      ...QuadrupedBody.LIMBS.flatMap((limb: QuadrupedBody.Limb): number[] =>
        source.limbs[limb].flatMap((point: IAutoMovieVector3): number[] => [
          Math.abs(point.x),
          Math.abs(point.y),
          Math.abs(point.z),
        ]),
      ),
    );
    const limbBones: Set<string> = new Set(
      QuadrupedBody.LIMBS.flatMap(
        (limb: QuadrupedBody.Limb): QuadrupedBody.Bone[] => [
          ...QuadrupedBody.BONES[limb],
        ],
      ),
    );
    /** Identity of the private chain workspaces and admitted rig in this prepared source. */
    const geometryOwner: object = {};
    return { sample };

    /** Read one actual foot primitive; no endpoint-only ground proxy is retained. */
    function end(
      limb: QuadrupedBody.Limb,
    ): (
      orientation: IAutoMovieQuaternion | undefined,
      lateral: boolean,
      normal?: IAutoMovieVector3,
    ) => End {
      const chain: readonly IAutoMovieVector3[] = source.limbs[limb];
      const terminal: IAutoMovieModelPart | undefined = parts.get(
        QuadrupedBody.BONES[limb][3]!,
      );
      if (
        terminal?.geometry.type !== "primitive" ||
        (terminal.geometry.shape.type !== "cylinder" &&
          terminal.geometry.shape.type !== "capsule")
      )
        throw new RangeError(`The ${limb} terminal solid is not a rigid bar`);
      const dx: number = chain[4]!.x - chain[3]!.x;
      const dy: number = chain[4]!.y - chain[3]!.y;
      const dz: number = chain[4]!.z - chain[3]!.z;
      const length: number = Math.hypot(dx, dy, dz);
      const axis: IAutoMovieVector3 = {
        x: dx / length,
        y: dy / length,
        z: dz / length,
      };
      const shape: typeof terminal.geometry.shape = terminal.geometry.shape;
      const prepared: QuadrupedLimb.IPrepared = QuadrupedLimb.prepare(
        chain,
        limb.endsWith("Fore"),
      );
      const defaultSupport: End = support(axis, false);
      return (
        orientation: IAutoMovieQuaternion | undefined,
        lateral: boolean,
        normal?: IAutoMovieVector3,
      ): End =>
        orientation === undefined && !lateral && normal === undefined
          ? defaultSupport
          : support(
              orientation === undefined
                ? axis
                : Quaternion.rotateVector(orientation, axis),
              true,
              normal,
            );

      /** Bind the exact support of the current terminal bar in model space. */
      function support(
        direction: IAutoMovieVector3,
        lateral: boolean,
        normal?: IAutoMovieVector3,
      ): End {
        const radial: number =
          shape.type === "capsule"
            ? shape.radius
            : shape.radius *
              (normal === undefined
                ? Math.hypot(direction.x, direction.z)
                : Vector3.length(Vector3.cross(direction, normal)));
        const vertical: number =
          normal === undefined ? direction.y : Vector3.dot(normal, direction);
        const clearance: number = Math.max(0, vertical) * shape.height + radial;
        if (!(Number.isFinite(clearance) && clearance >= 0))
          throw new RangeError(
            `The ${limb} sole clearance is not representable`,
          );
        return { solver: prepared.oriented(direction, lateral), clearance };
      }
    }

    /** Achieve four unchanged foot poses with one explicit whole-body trajectory. */
    function sample(
      goals: Readonly<Record<QuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
      witness?: ArchetypeRideWitness.Witness,
    ): Archetype<Id, Dimension> {
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
      const targets: Map<QuadrupedBody.Limb, Target> = new Map();
      const constraints: Readonly<
        Record<QuadrupedBody.Limb, QuadrupedRootRange.IConstraint>
      > = {
        leftFore: constraint("leftFore"),
        rightFore: constraint("rightFore"),
        leftHind: constraint("leftHind"),
        rightHind: constraint("rightHind"),
      };
      // Spans and any old source effects remain live on every call. Only the
      // geometry following this actual floor observation can share exact work.
      const floor: number = -pose.bodyFloor(preview.frames);
      const range: QuadrupedRootRange.IRange = QuadrupedRootRange.intersect(
        constraints,
        floor,
      );
      const coordinateScale: number = Math.max(
        sourceScale,
        ...[...targets.values()].flatMap((target: Target): number[] => [
          Math.abs(target.endpoint.x),
          Math.abs(target.endpoint.y),
          Math.abs(target.endpoint.z),
        ]),
      );
      /** Solve the shared-root limbs and prove their actual canonical FK. */
      const geometry = (): ReturnType<typeof pose.position> => {
        const height: number = chooseQuadrupedBodyRoot(
          range,
          preferredRoot,
          coordinateScale,
        );
        const root: IAutoMovieTransform = ArchetypeFrame.upright({
          x: 0,
          y: height,
          z: 0,
        });
        const solved: Map<QuadrupedBody.Limb, readonly IAutoMovieVector3[]> =
          new Map();
        for (const limb of QuadrupedBody.LIMBS) {
          const target: Target = targets.get(limb)!;
          solved.set(
            limb,
            target.solver.solve(
              { ...target.attachment, y: target.attachment.y + height },
              target.endpoint,
              target.fold,
            ),
          );
        }
        return pose.position(solved, root, axial);
      };
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
                ...QuadrupedBody.LIMBS.flatMap(
                  (limb: QuadrupedBody.Limb): number[] => [
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
      const result: Archetype<Id, Dimension> = prepared.emit(witness?.ode);

      // Terminal support alone cannot admit an elbow or folded lower bar
      // below the same floor. Verify those actual solids after exact FK.
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

      /** Convert one actual solid's lift to an exact endpoint/ankle constraint. */
      function constraint(
        limb: QuadrupedBody.Limb,
      ): QuadrupedRootRange.IConstraint {
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
          QuadrupedBody.BONES[limb][0]!,
        )!.translation;
        const surface: QuadrupedFooting.ISurface | undefined = goal.surface;
        const normal: IAutoMovieVector3 | undefined = surface?.normal;
        const support: End = ends[limb](
          goal.orientation,
          goal.x !== undefined,
          normal,
        );
        const x: number = goal.x ?? attachment.x;
        let y: number = goal.lift + support.clearance;
        if (surface !== undefined) {
          const { normal, point } = surface;
          if (!(normal.y > 0 && Number.isFinite(point.y)))
            throw new RangeError(
              `The ${limb} support plane does not face the actual body up axis`,
            );
          y =
            point.y +
            (y - normal.x * (x - point.x) - normal.z * (goal.z - point.z)) /
              normal.y;
        }
        const endpoint: IAutoMovieVector3 = { x, y, z: goal.z };
        targets.set(limb, {
          endpoint,
          fold: goal.fold,
          attachment,
          solver: support.solver,
        });
        return {
          attachment,
          goal: support.solver.target(endpoint),
          reach: support.solver.range(goal.fold),
        };
      }
    }
  }
}
