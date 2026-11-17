import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import type { QuadrupedJoints } from "./QuadrupedJoints";
import { QuadrupedLimb } from "./QuadrupedLimb";
import { QuadrupedPose } from "./QuadrupedPose";
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
    /** Terminal endpoint's forward coordinate in model space, metres. */
    z: number;
    /** Exact terminal solid clearance above the local floor, nonnegative metres. */
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
   * @evidence contracts/development/implementation.md#principled-implementation Preserve each actual terminal axis, derive its exact lowest-surface endpoint offset and prepare the oriented four-link solve. The same source geometry supplies neutral parent frames and shared rigid FK.
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
  ): IPrepared<Id, Dimension> {
    const bindings: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, species);
    const pose: QuadrupedPosePlan.IPrepared<Id, Dimension> = QuadrupedPose(
      animal,
      bindings.parts,
      bindings.contacts,
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
    const ends: Readonly<Record<QuadrupedBody.Limb, End>> = {
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
    return { sample };

    /** Read one actual foot primitive; no endpoint-only ground proxy is retained. */
    function end(limb: QuadrupedBody.Limb): End {
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
      const radial: number =
        shape.type === "capsule"
          ? shape.radius
          : shape.radius * Math.hypot(axis.x, axis.z);
      const clearance: number = Math.max(0, axis.y) * shape.height + radial;
      if (!(Number.isFinite(clearance) && clearance >= 0))
        throw new RangeError(`The ${limb} sole clearance is not representable`);
      return {
        solver: QuadrupedLimb.prepare(chain, limb.endsWith("Fore")).oriented(
          axis,
        ),
        clearance,
      };
    }

    /** Achieve four unchanged foot poses with one explicit whole-body trajectory. */
    function sample(
      goals: Readonly<Record<QuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
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
      const range: QuadrupedRootRange.IRange = QuadrupedRootRange.intersect(
        constraints,
        -pose.bodyFloor(preview.frames),
      );
      const coordinateScale: number = Math.max(
        sourceScale,
        ...[...targets.values()].flatMap((target: Target): number[] => [
          Math.abs(target.endpoint.x),
          Math.abs(target.endpoint.y),
          Math.abs(target.endpoint.z),
        ]),
      );
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
          ends[limb].solver.solve(
            { ...target.attachment, y: target.attachment.y + height },
            target.endpoint,
            target.fold,
          ),
        );
      }
      const result: Archetype<Id, Dimension> = pose.sample(
        solved,
        root,
        axial,
      ).animal;

      // Terminal support alone cannot admit an elbow or folded lower bar
      // below the same floor. Verify those actual solids after exact FK.
      const roundoff: number = 256 * Number.EPSILON * coordinateScale;
      for (const part of result.parts)
        if (limbBones.has(part.id)) {
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
          ![goal.z, goal.lift, goal.fold].every(Number.isFinite) ||
          goal.lift < 0
        )
          throw new RangeError(
            `The ${limb} footprint goal must be finite with nonnegative lift`,
          );
        const attachment: IAutoMovieVector3 = preview.frames.get(
          QuadrupedBody.BONES[limb][0]!,
        )!.translation;
        const endpoint: IAutoMovieVector3 = {
          x: attachment.x,
          y: goal.lift + ends[limb].clearance,
          z: goal.z,
        };
        targets.set(limb, { endpoint, fold: goal.fold, attachment });
        return {
          attachment,
          goal: ends[limb].solver.target(endpoint),
          reach: ends[limb].solver.range(goal.fold),
        };
      }
    }
  }
}
