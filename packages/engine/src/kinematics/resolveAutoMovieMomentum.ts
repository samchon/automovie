import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { samplePoseVelocity } from "../motion/samplePoseVelocity";
import type { combinePhysicalMassProperties } from "../physics/combinePhysicalMassProperties";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { physicalPrincipalAxes } from "../physics/physicalPrincipalAxes";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";

/**
 * Linear and angular momentum of a posed body from two of its poses `seconds`
 * apart, at the interval's middle, read from the mass model
 * `resolveAutoMovieCenterOfMass` builds once per body: every profile segment a
 * rigid part riding its bone, with its mass, centre and principal inertia.
 *
 * Airborne rotation, the response to an impulse and a pair's balance read the
 * momenta and the composite tensor about the centre of mass (#3422). Units
 * are kilograms, metres and seconds: linear momentum in kg m/s, angular
 * momentum in kg m²/s, in the frame the bones are given in (the world, or a
 * root's own frame when a caller passes root-frame bones).
 *
 * Each segment's velocity is the chord of its centre over the interval and
 * its angular velocity the rotation vector of its relative turn `Q1 Q0⁻¹`,
 * taken on the shorter arc (`samplePoseVelocity.rotationVector`), over the
 * interval: both are central differences about the middle, so their error is
 * second order in `seconds`. Each segment's position and principal frame are
 * read at the middle (the mean of its centres and the half-way slerp of its
 * frames), and the angular momentum about the middle's centre of mass is
 * `Σ m (c - C) × v + R diag(I) Rᵀ ω`, the segments' orbital and spin momenta.
 * A rigid turn of the whole body by `θ` over the interval introduces an
 * `O(θ²)` orbital error through the mean positions and velocity chords. The
 * logarithmic spin rate has no such universal scalar bias, and the complete
 * relative momentum error depends on the mass distribution and motion; this
 * stencil does not certify a relative error budget for a chosen interval.
 *
 * @param model The body's mass model.
 * @param before The posed bones at the interval's start.
 * @param after The posed bones at its end.
 * @param seconds The interval, seconds; positive.
 * @returns The momenta.
 * @throws {Error} When the interval is not positive or a segment's bone is not posed in both.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the model, the consumers, the units, the frame convention, both differences, where each quantity is read and the error of a rigid turn.
 * @evidence contracts/development/implementation.md#principled-implementation The angular momentum of a rigid multibody about its centre of mass is the sum of each part's orbital `m (c - C) × v` and spin `I ω` (any rigid-body dynamics text); the velocities are central differences, second order in the interval, with the relative rotation's rotation vector for the angular one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pose both ends once, then delegate their ordered parts and centres to the shared interval reduction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone or a non-positive interval throws; no momentum is clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in segments: one combined parts-and-centre pass at each end, one centre transform per segment and one momentum pass. Each spin consumes the physical tensor owner's nine scalar entries directly, without copied parts or temporary tensor rows. Fresh midpoint, displacement and rotation-vector results are scaled in place, avoiding one further record per segment and two per interval. Orbital coordinates accumulate as scalars without temporary vector records; tensor, cross-product, dot-product and segment-sum association remain unchanged.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each endpoint's posed centres serve both its whole-body centre and every orbital term. The history additionally shares these posed reductions within one exact query; no cross-query mutable bone state is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveAutoMovieMomentum(
  model: resolveAutoMovieCenterOfMass.IModel,
  before: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  after: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  seconds: number,
): resolveAutoMovieMomentum.IMomentum {
  if (!(seconds > 0))
    throw new Error(`The momentum needs a positive interval, got ${seconds}`);
  return resolveAutoMovieMomentum.between(
    model,
    resolveAutoMovieMomentum.pose(model, before),
    resolveAutoMovieMomentum.pose(model, after),
    seconds,
  );
}

/**
 * Companion types and readings of {@link resolveAutoMovieMomentum}: the
 * composite tensor, its principal frame and the posed parts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation A rigid multibody's composite inertia and momenta about its centre of mass, the quantities of Euler's equations; tensors are symmetric 3x3 rows as the engine's diagonalization takes them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Readings over the one mass model: posed parts and their centre, the interval momentum, tensor, principal frame and tensor product. The flight history consumes posed reductions to share each exact instant within its stencil.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tensor sum is `physicalInertiaTensor`'s, the diagonalization `physicalPrincipalAxes`'s and the ordered mass-weighted centre `resolveAutoMovieCenterOfMass.mean`'s, imported rather than copied.
 */
export namespace resolveAutoMovieMomentum {
  /** Linear and angular momentum of a body over an interval. */
  export interface IMomentum {
    /** The whole-body centre of mass at the interval's middle, the mean of its two ends, metres. */
    centre: IAutoMovieVector3;

    /** The centre's velocity over the interval, metres per second. */
    velocity: IAutoMovieVector3;

    /** Linear momentum, the total mass times `velocity`, kg m/s. */
    linear: IAutoMovieVector3;

    /** Angular momentum about `centre`, kg m²/s. */
    angular: IAutoMovieVector3;
  }

  /** A tensor's principal frame. */
  export interface IPrincipal {
    /** The principal moments in ascending order, in the tensor's unit. */
    moments: IAutoMovieVector3;

    /** The rotation from the principal frame to the tensor's frame; its columns are the moments' axes. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * One model's parts and whole-body centre at the same posed instant.
   *
   * Both use the bones' common frame and the model's segment order. The
   * caller owns this reduction and must not combine it with a different
   * model or mutate it while its interval or tensor is being read.
   */
  export interface IPosed {
    /** Rigid parts in model order, with SI masses, centres and inertia. */
    parts: readonly combinePhysicalMassProperties.IPart[];

    /** Mass-weighted centre in the parts' common frame, metres. */
    centre: IAutoMovieVector3;
  }

  /**
   * Pose each segment and reduce its transformed centre in one ordered
   * pass through the mass model. The returned parts and centre serve interval
   * momentum and composite inertia without a second centre transform.
   * Missing bones retain parts' admission error. The result owns fresh
   * posed records and retains no bone map or reader.
   */
  export function pose(
    model: resolveAutoMovieCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IPosed {
    const posed: combinePhysicalMassProperties.IPart[] = [];
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.mean(
      model,
      (segment: resolveAutoMovieCenterOfMass.ISegment): IAutoMovieVector3 => {
        const part: combinePhysicalMassProperties.IPart = posePart(segment, bones);
        posed.push(part);
        return part.centerOfMass;
      },
    );
    return { parts: posed, centre };
  }

  /**
   * Reduce the interval's momentum from two poses of the same model.
   *
   * Endpoint centres, per-part chords, shortest-arc angular differences,
   * midpoint frames and segment summation order match the bone-map entry.
   * Seconds must be positive; callers supply this model's ordered posed
   * reductions in the same frame. The interval reciprocal serves every
   * rate and scalar orbital coordinates preserve each original product,
   * cross difference and segment addition. Scaling mutates only fresh vector
   * results; neither endpoint is changed or retained by the numeric momentum.
   */
  export function between(
    model: resolveAutoMovieCenterOfMass.IModel,
    before: IPosed,
    after: IPosed,
    seconds: number,
  ): IMomentum {
    if (!(seconds > 0))
      throw new Error(`The momentum needs a positive interval, got ${seconds}`);
    const reciprocal: number = 1 / seconds;
    const centre: IAutoMovieVector3 = Vector3.add(before.centre, after.centre);
    centre.x *= 0.5;
    centre.y *= 0.5;
    centre.z *= 0.5;
    const velocity: IAutoMovieVector3 = Vector3.subtract(after.centre, before.centre);
    velocity.x *= reciprocal;
    velocity.y *= reciprocal;
    velocity.z *= reciprocal;

    // Orbital plus spin momentum of each segment at the interval's middle.
    let angularX: number = 0;
    let angularY: number = 0;
    let angularZ: number = 0;
    for (let i: number = 0; i < before.parts.length; i++) {
      const p0: combinePhysicalMassProperties.IPart = before.parts[i]!;
      const p1: combinePhysicalMassProperties.IPart = after.parts[i]!;

      // Retain mean-then-offset and chord-then-reciprocal association.
      const x: number = (p0.centerOfMass.x + p1.centerOfMass.x) * 0.5 - centre.x;
      const y: number = (p0.centerOfMass.y + p1.centerOfMass.y) * 0.5 - centre.y;
      const z: number = (p0.centerOfMass.z + p1.centerOfMass.z) * 0.5 - centre.z;
      const vx: number = (p1.centerOfMass.x - p0.centerOfMass.x) * reciprocal;
      const vy: number = (p1.centerOfMass.y - p0.centerOfMass.y) * reciprocal;
      const vz: number = (p1.centerOfMass.z - p0.centerOfMass.z) * reciprocal;
      const w: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
        Quaternion.multiply(
          p1.inertiaRotation,
          Quaternion.inverse(p0.inertiaRotation),
        ),
      );
      w.x *= reciprocal;
      w.y *= reciprocal;
      w.z *= reciprocal;
      const spin: IAutoMovieVector3 = physicalInertiaTensor.spin(
        p0,
        Quaternion.slerp(p0.inertiaRotation, p1.inertiaRotation, 0.5),
        w,
      );

      // m ((middle - centre) cross velocity) + spin, followed by the same
      // left-to-right model-order addition as the vector accumulation.
      angularX += (y * vz - z * vy) * p0.mass + spin.x;
      angularY += (z * vx - x * vz) * p0.mass + spin.y;
      angularZ += (x * vy - y * vx) * p0.mass + spin.z;
    }
    return {
      centre,
      velocity,
      linear: Vector3.scale(velocity, model.mass),
      angular: { x: angularX, y: angularY, z: angularZ },
    };
  }

  /**
   * The composite inertia tensor of a posed body about its whole-body centre
   * of mass, in the bones' frame: each segment's principal tensor turned by
   * its bone's rotation times its rest axes and shifted by the parallel-axis
   * theorem (`physicalInertiaTensor`).
   *
   * @param model The body's mass model.
   * @param bones The posed bones.
   * @returns The symmetric tensor, kg m².
   * @throws {Error} When a segment's bone is not posed.
   */
  export function inertia(
    model: resolveAutoMovieCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number[][] {
    const posed: IPosed = pose(model, bones);
    return physicalInertiaTensor(posed.parts, posed.centre);
  }

  /**
   * A tensor's principal moments and axes, by the engine's Jacobi
   * diagonalization; the tensor is copied, not consumed.
   *
   * @param tensor A symmetric 3x3 tensor.
   * @returns Its principal frame.
   * @throws {Error} When every entry is zero.
   */
  export function principal(
    tensor: readonly (readonly number[])[],
  ): IPrincipal {
    return physicalPrincipalAxes(
      tensor.map((row: readonly number[]): number[] => [...row]),
    );
  }

  /**
   * A tensor applied to a vector, `T v`.
   *
   * @param tensor A 3x3 tensor.
   * @param v The vector.
   * @returns The product.
   */
  export function apply(
    tensor: readonly (readonly number[])[],
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const row: (r: readonly number[]) => number = (
      r: readonly number[],
    ): number => r[0]! * v.x + r[1]! * v.y + r[2]! * v.z;
    return { x: row(tensor[0]!), y: row(tensor[1]!), z: row(tensor[2]!) };
  }

  /**
   * Every segment of a model as a rigid part posed by its bone: its centre
   * carried from the bone's frame and its principal axes turned by the
   * bone's rotation.
   *
   * @param model The body's mass model.
   * @param bones The posed bones.
   * @returns The parts, in the bones' frame, in the model's segment order.
   * @throws {Error} When a segment's bone is not posed.
   */
  export function parts(
    model: resolveAutoMovieCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): combinePhysicalMassProperties.IPart[] {
    return model.segments.map(
      (
        s: resolveAutoMovieCenterOfMass.ISegment,
      ): combinePhysicalMassProperties.IPart => posePart(s, bones),
    );
  }
}

/**
 * Pose one admitted model segment for both the parts-only and combined
 * reductions. Each centre is fresh; the unchanged model's inertia is shared
 * as before, and no bone map survives in the returned part.
 */
function posePart(
  segment: resolveAutoMovieCenterOfMass.ISegment,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): combinePhysicalMassProperties.IPart {
  const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone);
  if (bone === undefined)
    throw new Error(`The momentum needs the posed bone ${segment.bone}`);
  return {
    mass: segment.mass,
    centerOfMass: resolveAutoMovieCenterOfMass.point(segment, bone),
    inertia: segment.inertia,
    inertiaRotation: Quaternion.multiply(bone.worldRotation, segment.axes),
  };
}
