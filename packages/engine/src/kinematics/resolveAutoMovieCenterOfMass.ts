import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { nearestHullEdge } from "../math/nearestHullEdge";
import { pointInHull } from "../math/pointInHull";
import { AutoMovieGravity } from "../physics/AutoMovieGravity";
import { prepareSkeletonPoseResolution } from "./prepareSkeletonPoseResolution";
import { resolvePose } from "./resolvePose";

/**
 * Resolve a body's mass model: every profile segment's mass and centre of mass
 * as a point riding its bone, so the whole-body centre of mass of any pose is
 * the mass-weighted mean of those points (the segmental method of biomechanics,
 * Winter, Biomechanics and Motor Control of Human Movement, ch. 4).
 *
 * A segment's centre of mass is read at rest from its neutral frame and stored
 * relative to its bone's rest joint in the bone's rest frame, the same
 * bone-local convention as the surface frames, so posing it is the bone's world
 * position plus its world rotation applied to the stored point.
 *
 * @param skeleton The rig.
 * @param profile Its physical profile, segments keyed by rig bones.
 * @returns The mass model.
 * @throws {Error} When a segment's bone is not in the rig or the profile has no
 *   positive mass.
 */
export function resolveAutoMovieCenterOfMass(
  skeleton: IAutoMovieSkeleton,
  profile: IAutoMoviePhysicalProfile,
): IAutoMovieResolveCenterOfMass.IModel {
  return fromRest(
    profile,
    resolvePose({ skeleton: skeleton.id, root: null, joints: [] }, skeleton),
  );
}

/**
 * One segmental construction consumes actual fresh rest FK, never a public
 * derived-value flag.
 */
function fromRest(
  profile: IAutoMoviePhysicalProfile,
  frames: readonly IAutoMovieResolvedBone[],
): IAutoMovieResolveCenterOfMass.IModel {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const frame of frames) rest.set(frame.bone, frame);
  const segments: IAutoMovieResolveCenterOfMass.ISegment[] =
    profile.segments.map(
      (
        s: IAutoMoviePhysicalSegment,
      ): IAutoMovieResolveCenterOfMass.ISegment => {
        const bone: IAutoMovieResolvedBone | undefined = rest.get(
          s.bone as AutoMovieHumanoidBone,
        );
        if (bone === undefined)
          throw new Error(`The mass model needs the rig bone ${s.bone}`);
        const origin: IAutoMovieVector3 = s.neutral.position;
        const world: IAutoMovieVector3 = Quaternion.rotateVector(
          s.neutral.rotation,
          s.centerOfMass,
        );
        world.x = origin.x + world.x;
        world.y = origin.y + world.y;
        world.z = origin.z + world.z;
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

/** Companion types and helpers of {@link resolveAutoMovieCenterOfMass}. */
export namespace resolveAutoMovieCenterOfMass {
  /**
   * Derive this profile's bone-local model against a genuine immutable rig. The
   * producer supplies actual root-null, identity-articulation rest frames with
   * the ordinary parent-first arithmetic, then the same segmental constructor
   * performs all original missing-bone and positive-mass checks. Later
   * source-rig edits do not alter that snapshot; recreate the body/rig to adopt
   * them. The profile is read currently and must belong to that rig. Public
   * rig.resolve replacement cannot inject derived frames here. Fresh rest
   * copies and their map are call-local; model points/axes are fresh, and
   * principal moments retain their original profile ownership.
   */
  export function fromRig(
    rig: prepareSkeletonPoseResolution.IRig,
    profile: IAutoMoviePhysicalProfile,
  ): IAutoMovieResolveCenterOfMass.IModel {
    return fromRest(profile, prepareSkeletonPoseResolution.rest(rig));
  }

  /**
   * The inverted pendulum's length in hip heights: the leg length, about 1.34
   * times the trochanteric height (Hof, Gazendam and Sinke 2005, J Biomech
   * 38:1), which `pendulum` takes its length from.
   */
  export const PENDULUM: number = 1.34;

  /**
   * The inverted pendulum's length of a body: Hof's leg length, `PENDULUM` hip
   * heights.
   *
   * @param hipHeight The body's hip height, metres.
   * @returns The pendulum's length, metres.
   */
  export function pendulum(hipHeight: number): number {
    return PENDULUM * hipHeight;
  }

  /**
   * The inverted pendulum's eigenfrequency, `ω0 = sqrt(g / l)` (Hof, Gazendam
   * and Sinke 2005): its reciprocal is the time a centre of mass takes to cover
   * its own velocity's extrapolation.
   *
   * @param length The pendulum's length, metres; positive.
   * @param gravity Gravitational acceleration, m/s²; standard gravity
   *   (`AutoMovieGravity.STANDARD`) when absent.
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
    return mean(
      model,
      (s: IAutoMovieResolveCenterOfMass.ISegment): IAutoMovieVector3 => {
        const bone: IAutoMovieResolvedBone | undefined = bones.get(s.bone);
        if (bone === undefined)
          throw new Error(`The centre of mass needs the posed bone ${s.bone}`);
        return point(s, bone);
      },
    );
  }

  /**
   * One segment's bone-local centre posed in the bone's common frame, metres.
   *
   * The caller supplies this segment's bone with a unit world rotation and owns
   * missing-bone admission. Quaternion rotation returns a fresh point, so
   * adding worldPosition before that point in each component preserves the
   * placement arithmetic without copying another vector. Neither the segment's
   * local point nor any bone field is changed or retained.
   */
  export function point(
    segment: IAutoMovieResolveCenterOfMass.ISegment,
    bone: IAutoMovieResolvedBone,
  ): IAutoMovieVector3 {
    const origin: IAutoMovieVector3 = bone.worldPosition;
    const posed: IAutoMovieVector3 = Quaternion.rotateVector(
      bone.worldRotation,
      segment.point,
    );
    posed.x = origin.x + posed.x;
    posed.y = origin.y + posed.y;
    posed.z = origin.z + posed.z;
    return posed;
  }

  /**
   * The model's mass-weighted centre from already posed segment points.
   *
   * Placement and momentum use the same segment-order sum and total mass. The
   * reader is called once per segment in model order, with its index, and
   * returns a centre in the caller's common frame, metres. Neither the reader
   * nor its points are retained; admission remains with its caller.
   */
  export function mean(
    model: IAutoMovieResolveCenterOfMass.IModel,
    read: (
      segment: IAutoMovieResolveCenterOfMass.ISegment,
      index: number,
    ) => IAutoMovieVector3,
  ): IAutoMovieVector3 {
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;
    for (let i: number = 0; i < model.segments.length; i++) {
      const s: IAutoMovieResolveCenterOfMass.ISegment = model.segments[i]!;
      const p: IAutoMovieVector3 = read(s, i);
      x += s.mass * p.x;
      y += s.mass * p.y;
      z += s.mass * p.z;
    }
    return { x: x / model.mass, y: y / model.mass, z: z / model.mass };
  }

  /**
   * The extrapolated centre of mass (XCoM) of Hof, Gazendam and Sinke (2005,
   * "The condition for dynamic stability", J. Biomech. 38): the centre of mass
   * plus its velocity over the inverted pendulum's eigenfrequency, `x + v / ω0`
   * with `ω0 = sqrt(g / l)` (`frequency`), where `l` is the pendulum length
   * (Hof takes the leg length, `pendulum`).
   *
   * The scaled velocity is fresh, so the same ordered centre-plus-offset sums
   * reuse it without another vector or any mutation of either input.
   *
   * @param com The centre of mass, world metres.
   * @param velocity Its velocity, metres per second.
   * @param length The pendulum length, metres; positive.
   * @param gravity Gravitational acceleration, m/s²; standard gravity
   *   (`AutoMovieGravity.STANDARD`) when absent.
   * @returns The extrapolated centre of mass, world metres.
   * @throws {Error} When the length or gravity is not positive.
   */
  export function extrapolate(
    com: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    length: number,
    gravity: number = AutoMovieGravity.STANDARD,
  ): IAutoMovieVector3 {
    const offset: IAutoMovieVector3 = Vector3.scale(
      velocity,
      1 / frequency(length, gravity),
    );
    offset.x = com.x + offset.x;
    offset.y = com.y + offset.y;
    offset.z = com.z + offset.z;
    return offset;
  }

  /**
   * The margin of stability of Hof et al. (2005): the horizontal distance from
   * a point (the extrapolated centre of mass) to the nearest edge of the base
   * of support, the convex hull of the support points on the floor plane,
   * positive inside the hull and negative outside, metres.
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
