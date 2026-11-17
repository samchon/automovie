import type { IAutoMovieResolvedBone, IAutoMoviePhysicalProfile, IAutoMovieResolveCenterOfMass, AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";



import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { nearestHullEdge } from "../math/nearestHullEdge";
import { pointInHull } from "../math/pointInHull";
import { AutoMovieGravity } from "../physics/AutoMovieGravity";
import { resolvePose } from "./resolvePose";

/**
 * Resolve a body's mass model: every profile segment's mass and centre of
 * mass as a point riding its bone, so the whole-body centre of mass of any
 * pose is the mass-weighted mean of those points (the segmental method of
 * biomechanics, Winter, Biomechanics and Motor Control of Human Movement,
 * ch. 4).
 *
 * A segment's centre of mass is read at rest from its neutral frame and
 * stored relative to its bone's rest joint in the bone's rest frame, the same
 * bone-local convention as the surface frames, so posing it is the bone's
 * world position plus its world rotation applied to the stored point.
 *
 * @param skeleton The rig.
 * @param profile Its physical profile, segments keyed by rig bones.
 * @returns The mass model.
 * @throws {Error} When a segment's bone is not in the rig or the profile has no positive mass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the segmental method, its source, and the bone-local convention.
 * @evidence contracts/development/implementation.md#principled-implementation The whole-body centre of mass is the mass-weighted mean of segment centres; the extrapolated centre and margin are Hof's definitions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One model, one placement, one extrapolation and one margin.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A segment on a missing bone or a massless profile throws instead of skewing the mean.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in segments per pose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the body; callers resolve once per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
 */
export function resolveAutoMovieCenterOfMass(
  skeleton: IAutoMovieSkeleton,
  profile: IAutoMoviePhysicalProfile,
): IAutoMovieResolveCenterOfMass.IModel {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    resolvePose(
      { skeleton: skeleton.id, root: null, joints: [] },
      skeleton,
    ).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
    ),
  );
  const segments: IAutoMovieResolveCenterOfMass.ISegment[] =
    profile.segments.map(
      (s: IAutoMoviePhysicalProfile.ISegment): IAutoMovieResolveCenterOfMass.ISegment => {
        const bone: IAutoMovieResolvedBone | undefined = rest.get(
          s.bone as AutoMovieHumanoidBone,
        );
        if (bone === undefined)
          throw new Error(`The mass model needs the rig bone ${s.bone}`);
        const world: IAutoMovieVector3 = Vector3.add(
          s.neutral.position,
          Quaternion.rotateVector(s.neutral.rotation, s.centerOfMass),
        );
        const unturn: IAutoMovieQuaternion = Quaternion.inverse(
          bone.worldRotation,
        );
        return {
          bone: bone.bone,
          mass: s.mass,
          point: Quaternion.rotateVector(
            unturn,
            Vector3.subtract(world, bone.worldPosition),
          ),
          inertia: s.inertia,

          // The principal axes go from the segment's neutral frame to the
          // bone's rest frame as the centre does, so a pose turns them by
          // the bone's world rotation alone.
          axes: Quaternion.normalize(
            Quaternion.multiply(
              unturn,
              Quaternion.multiply(s.neutral.rotation, s.inertiaRotation),
            ),
          ),
        };
      },
    );
  const mass: number = segments.reduce(
    (sum: number, s: IAutoMovieResolveCenterOfMass.ISegment): number =>
      sum + s.mass,
    0,
  );
  if (!(mass > 0))
    throw new Error("The mass model needs a positive total mass");
  return { mass, segments };
}

/**
 * Companion types and helpers of {@link resolveAutoMovieCenterOfMass}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame, unit and source.
 * @evidence contracts/development/design.md#principled-representation Bone-local segment points with masses; world points in, world points and metres out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The centre of mass, its extrapolation and the margin of stability are what balance consumers read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses resolved bones and the engine's hull routines.
 */
export namespace resolveAutoMovieCenterOfMass {

  /** The inverted pendulum's length in hip heights: the leg length, about 1.34 times the trochanteric height (Hof, Gazendam and Sinke 2005, J Biomech 38:1), which `pendulum` takes its length from. */
  export const PENDULUM: number = 1.34;

  /**
   * The inverted pendulum's length of a body: Hof's leg length, `PENDULUM`
   * hip heights.
   *
   * @param hipHeight The body's hip height, metres.
   * @returns The pendulum's length, metres.
   */
  export function pendulum(hipHeight: number): number {
    return PENDULUM * hipHeight;
  }

  /**
   * The inverted pendulum's eigenfrequency, `ω0 = sqrt(g / l)` (Hof,
   * Gazendam and Sinke 2005): its reciprocal is the time a centre of mass
   * takes to cover its own velocity's extrapolation.
   *
   * @param length The pendulum's length, metres; positive.
   * @param gravity Gravitational acceleration, m/s²; standard gravity (`AutoMovieGravity.STANDARD`) when absent.
   * @returns Radians per second.
   * @throws {Error} When the length or gravity is not positive.
   */
  export function frequency(
    length: number,
    gravity: number = AutoMovieGravity.STANDARD,
  ): number {
    if (!(length > 0) || !(gravity > 0))
      throw new Error(
        `The inverted pendulum needs a positive length and gravity, got ${length} and ${gravity}`,
      );
    return Math.sqrt(gravity / length);
  }

  /**
   * The whole-body centre of mass of a posed body.
   *
   * @param model The mass model.
   * @param bones The posed bones, world frame.
   * @returns The centre of mass, world metres.
   * @throws {Error} When a segment's bone is not posed.
   */
  export function place(
    model: IAutoMovieResolveCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;
    for (const s of model.segments) {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(s.bone);
      if (bone === undefined)
        throw new Error(`The centre of mass needs the posed bone ${s.bone}`);
      const p: IAutoMovieVector3 = Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, s.point),
      );
      x += s.mass * p.x;
      y += s.mass * p.y;
      z += s.mass * p.z;
    }
    return { x: x / model.mass, y: y / model.mass, z: z / model.mass };
  }

  /**
   * The extrapolated centre of mass (XCoM) of Hof, Gazendam and Sinke (2005,
   * "The condition for dynamic stability", J. Biomech. 38): the centre of
   * mass plus its velocity over the inverted pendulum's eigenfrequency,
   * `x + v / ω0` with `ω0 = sqrt(g / l)` (`frequency`), where `l` is the
   * pendulum length (Hof takes the leg length, `pendulum`).
   *
   * @param com The centre of mass, world metres.
   * @param velocity Its velocity, metres per second.
   * @param length The pendulum length, metres; positive.
   * @param gravity Gravitational acceleration, m/s²; standard gravity (`AutoMovieGravity.STANDARD`) when absent.
   * @returns The extrapolated centre of mass, world metres.
   * @throws {Error} When the length or gravity is not positive.
   */
  export function extrapolate(
    com: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    length: number,
    gravity: number = AutoMovieGravity.STANDARD,
  ): IAutoMovieVector3 {
    return Vector3.add(
      com,
      Vector3.scale(velocity, 1 / frequency(length, gravity)),
    );
  }

  /**
   * The margin of stability of Hof et al. (2005): the horizontal distance
   * from a point (the extrapolated centre of mass) to the nearest edge of the
   * base of support, the convex hull of the support points on the floor
   * plane, positive inside the hull and negative outside, metres.
   *
   * @param point The point, world metres; its height is ignored.
   * @param support The support contact points, world metres.
   * @returns The signed margin, metres.
   * @throws {Error} When there is no support point.
   */
  export function margin(
    point: IAutoMovieVector3,
    support: readonly IAutoMovieVector3[],
  ): number {
    if (support.length === 0)
      throw new Error("The margin of stability needs a support point");
    const hull: IAutoMovieVector3[] = convexHull2D(support);
    const distance: number = nearestHullEdge(point, hull).distance;
    return hull.length >= 3 && pointInHull(point, hull) ? distance : -distance;
  }
}
