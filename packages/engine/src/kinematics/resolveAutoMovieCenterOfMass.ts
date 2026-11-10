import type {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { nearestHullEdge } from "../math/nearestHullEdge";
import { pointInHull } from "../math/pointInHull";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
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
  profile: P,
): resolveAutoMovieCenterOfMass.IModel {
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
  const segments: resolveAutoMovieCenterOfMass.ISegment[] =
    profile.segments.map(
      (s: P.ISegment): resolveAutoMovieCenterOfMass.ISegment => {
        const bone: IAutoMovieResolvedBone | undefined = rest.get(
          s.bone as AutoMovieHumanoidBone,
        );
        if (bone === undefined)
          throw new Error(`The mass model needs the rig bone ${s.bone}`);
        const world: IAutoMovieVector3 = Vector3.add(
          s.neutral.position,
          Quaternion.rotateVector(s.neutral.rotation, s.centerOfMass),
        );
        return {
          bone: bone.bone,
          mass: s.mass,
          point: Quaternion.rotateVector(
            Quaternion.inverse(bone.worldRotation),
            Vector3.subtract(world, bone.worldPosition),
          ),
        };
      },
    );
  const mass: number = segments.reduce(
    (sum: number, s: resolveAutoMovieCenterOfMass.ISegment): number =>
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
  /** A body's mass model. */
  export interface IModel {
    /** Total mass, kilograms. */
    mass: number;

    /** Every segment's mass point. */
    segments: ISegment[];
  }

  /** One segment's mass point. */
  export interface ISegment {
    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Kilograms. */
    mass: number;

    /** Centre of mass relative to the bone's joint, in its rest frame, metres. */
    point: IAutoMovieVector3;
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
    model: IModel,
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
   * `x + v / ω0` with `ω0 = sqrt(g / l)`, where `l` is the pendulum length
   * (Hof takes the leg length, about 1.34 times the trochanteric height).
   *
   * @param com The centre of mass, world metres.
   * @param velocity Its velocity, metres per second.
   * @param length The pendulum length, metres; positive.
   * @param gravity Gravitational acceleration, m/s²; 9.81 when absent.
   * @returns The extrapolated centre of mass, world metres.
   * @throws {Error} When the length or gravity is not positive.
   */
  export function extrapolate(
    com: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    length: number,
    gravity: number = 9.81,
  ): IAutoMovieVector3 {
    if (!(length > 0) || !(gravity > 0))
      throw new Error(
        `The extrapolated centre needs a positive length and gravity, got ${length} and ${gravity}`,
      );
    return Vector3.add(
      com,
      Vector3.scale(velocity, 1 / Math.sqrt(gravity / length)),
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
