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
 * A rigid turn of the whole body by `θ` over the interval reads `I ω` short by
 * a relative `θ² / 6`, which a caller keeps small by its choice of `seconds`.
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pose the parts at both ends, place the two centres through the model's own `place`, then one pass over the segments.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone or a non-positive interval throws; no momentum is clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in segments: two posings and one pass, each segment's spin tensor a single-part sum.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments; the model is built once per body by its caller.
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
  const a: combinePhysicalMassProperties.IPart[] =
    resolveAutoMovieMomentum.parts(model, before);
  const b: combinePhysicalMassProperties.IPart[] =
    resolveAutoMovieMomentum.parts(model, after);
  const ca: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    before,
  );
  const cb: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    after,
  );
  const centre: IAutoMovieVector3 = Vector3.scale(Vector3.add(ca, cb), 0.5);
  const velocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(cb, ca),
    1 / seconds,
  );

  // Orbital plus spin momentum of each segment at the interval's middle.
  let angular: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  a.forEach((p0: combinePhysicalMassProperties.IPart, i: number): void => {
    const p1: combinePhysicalMassProperties.IPart = b[i]!;
    const middle: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(p0.centerOfMass, p1.centerOfMass),
      0.5,
    );
    const v: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(p1.centerOfMass, p0.centerOfMass),
      1 / seconds,
    );
    const w: IAutoMovieVector3 = Vector3.scale(
      samplePoseVelocity.rotationVector(
        Quaternion.multiply(
          p1.inertiaRotation,
          Quaternion.inverse(p0.inertiaRotation),
        ),
      ),
      1 / seconds,
    );
    const spin: number[][] = physicalInertiaTensor(
      [
        {
          ...p0,
          inertiaRotation: Quaternion.slerp(
            p0.inertiaRotation,
            p1.inertiaRotation,
            0.5,
          ),
        },
      ],
      p0.centerOfMass,
    );
    angular = Vector3.add(
      angular,
      Vector3.add(
        Vector3.scale(
          Vector3.cross(Vector3.subtract(middle, centre), v),
          p0.mass,
        ),
        resolveAutoMovieMomentum.apply(spin, w),
      ),
    );
  });
  return {
    centre,
    velocity,
    linear: Vector3.scale(velocity, model.mass),
    angular,
  };
}

/**
 * Companion types and readings of {@link resolveAutoMovieMomentum}: the
 * composite tensor, its principal frame and the posed parts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation A rigid multibody's composite inertia and momenta about its centre of mass, the quantities of Euler's equations; tensors are symmetric 3x3 rows as the engine's diagonalization takes them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Readings over the one mass model: the tensor, the principal frame, a tensor's product and the posed parts; no second segment table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tensor sum is `physicalInertiaTensor`'s, the diagonalization `physicalPrincipalAxes`'s and the centre `resolveAutoMovieCenterOfMass.place`'s, imported rather than copied.
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
    return physicalInertiaTensor(
      parts(model, bones),
      resolveAutoMovieCenterOfMass.place(model, bones),
    );
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
    const row = (r: readonly number[]): number =>
      r[0]! * v.x + r[1]! * v.y + r[2]! * v.z;
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
      ): combinePhysicalMassProperties.IPart => {
        const bone: IAutoMovieResolvedBone | undefined = bones.get(s.bone);
        if (bone === undefined)
          throw new Error(`The momentum needs the posed bone ${s.bone}`);
        return {
          mass: s.mass,
          centerOfMass: Vector3.add(
            bone.worldPosition,
            Quaternion.rotateVector(bone.worldRotation, s.point),
          ),
          inertia: s.inertia,
          inertiaRotation: Quaternion.multiply(bone.worldRotation, s.axes),
        };
      },
    );
  }
}
