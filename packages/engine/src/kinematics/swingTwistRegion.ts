import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { swingConeAngle } from "../rom/swingConeAngle";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { swingTwistBasis } from "./swingTwistBasis";

/**
 * The swing region of a ball joint: the farthest the limb may point from its
 * rest direction along each great circle, read once off the constraint's
 * flexion and abduction intervals and kept.
 *
 * The region is the star of the directions the intervals reach with no twist
 * (and the constraint's `swingDeg`), widened for a proximal twist by the reach
 * of every twist in its interval, and raised so it turns no faster than
 * `SLOPE` with the azimuth. `swingTwistRange` reads its radius and brings a
 * rotation back into it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the region is, how its table is built from the constraint and what it is widened and raised by.
 * @evidence contracts/development/design.md#principled-representation The region is a radius per great circle, the representation a radial projection needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, the table of a constraint; the reading and the projection are `swingTwistRange`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named: the axes, the rest frame and the intervals are the caller's.
 */
export namespace swingTwistRegion {
  /**
   * The joint's frame the region is read in: its axes and its rest frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the axes are the joint's clinical basis, that the rest frame lifts its angles and that an absent frame leaves them rest-relative.
   * @evidence contracts/development/design.md#principled-representation The caller's clinical axis basis and rest frame, the two things that turn a rotation's angles into the joint's clinical ones.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the table and by the key it is kept under.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint or bone is named, and the members are the engine's own types.
   */
  export interface IJoint {
    /** The joint's clinical axes. */
    axes: IAutoMovieJointAxes;

    /** The rest frame its clinical angles are lifted by. */
    frame?: IAutoMovieRestFrame | undefined;
  }

  /**
   * The radius table of a constraint on a joint's frame.
   *
   * @param constraint The constraint.
   * @param joint The joint's axes and rest frame.
   * @returns The radius on each of `swingTwistBasis.RAYS` great circles, degrees; built on first use and kept.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the table, its units and that it is kept.
   * @evidence contracts/development/implementation.md#principled-implementation Each radius is the farthest reached swing found by a scan from the far end and a bisection, widened for a proximal twist and raised to the slope bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A lookup, and the build in three steps on a miss.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scan runs from the far end, so a ray the ranges leave and re-enter keeps its farthest reach. `SLOPE` (3) is provisional; `SCAN` and `HALVINGS` are resolutions.
   * @evidence contracts/development/implementation.md#efficient-algorithms The table is built once per constraint and frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every call after the first reads the kept table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The tables are kept in a WeakMap keyed by the constraint object and released with it.
   */
  export function table(
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): Float64Array {
    let byJoint: Map<string, Float64Array> | undefined = TABLES.get(constraint);
    if (byJoint === undefined) {
      byJoint = new Map();
      TABLES.set(constraint, byJoint);
    }
    const key: string = JSON.stringify([joint.axes, joint.frame ?? null]);
    let kept: Float64Array | undefined = byJoint.get(key);
    if (kept === undefined) {
      kept = build(constraint, joint);
      byJoint.set(key, kept);
    }
    return kept;
  }
}

/** The radius tables, per constraint and per frame. */
const TABLES: WeakMap<
  IAutoMovieJointConstraint,
  Map<string, Float64Array>
> = new WeakMap();

/** The fastest the region's radius may change with the azimuth, degrees per degree (provisional: three, so a projection's step is at most about three times the azimuth's step). */
const SLOPE: number = 3;

/** The step of the scan for the farthest reached swing on a ray, degrees. */
const SCAN: number = 0.5;

/** The bisections that refine it: twenty halve half a degree to under a millionth. */
const HALVINGS: number = 20;

/** The region's radius on each ray: reached, widened and raised. */
function build(
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRegion.IJoint,
): Float64Array {
  return raise(widen(reach(constraint, joint), constraint, joint));
}

/**
 * The farthest swing along each ray at which the flexion and abduction
 * intervals reach the direction, found by a scan from the far end in `SCAN`
 * degree steps toward the rest direction and refined by `HALVINGS` bisections.
 */
function reach(
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRegion.IJoint,
): Float64Array {
  const basis: swingTwistBasis.IBasis = swingTwistBasis.of(joint.axes);
  const table: Float64Array = new Float64Array(swingTwistBasis.RAYS);
  for (let ray: number = 0; ray < swingTwistBasis.RAYS; ++ray) {
    const azimuth: number = (360 * ray) / swingTwistBasis.RAYS;
    const inside = (swing: number): boolean =>
      reached(
        constraint,
        joint,
        basis,
        swingTwistBasis.direction(basis, swing, azimuth),
      );
    let hi: number = 180;
    let lo: number = 0;
    for (let swing: number = 180 - SCAN; swing > 0; swing -= SCAN) {
      if (inside(swing)) {
        lo = swing;
        break;
      }
      hi = swing;
    }
    for (let i: number = 0; i < HALVINGS && lo > 0; ++i) {
      const mid: number = (lo + hi) / 2;
      if (inside(mid)) lo = mid;
      else hi = mid;
    }
    table[ray] = lo;
  }
  return table;
}

/**
 * A proximal twist turns about the rest axis outside the flexion and the
 * abduction, so it carries every reached direction around the rest direction
 * by its own angle: on a hip flexed forward it swings the thigh sideways. The
 * directions its interval reaches are then those of no twist turned by any
 * twist in it, which shifts each ray's reach along the azimuth.
 */
function widen(
  table: Float64Array,
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRegion.IJoint,
): Float64Array {
  const twist: IAutoMovieAngleRange | null = constraint.twist;
  if (joint.axes.twistPlacement === "distal" || twist === null) return table;
  const ends: readonly number[] = [
    toRigAngle(twist.min, joint.frame?.twist)!,
    toRigAngle(twist.max, joint.frame?.twist)!,
  ];
  const low: number = Math.min(...ends);
  const high: number = Math.max(...ends);
  const width: number = 360 / swingTwistBasis.RAYS;
  const turned: Float64Array = new Float64Array(swingTwistBasis.RAYS);
  for (let ray: number = 0; ray < swingTwistBasis.RAYS; ++ray) {
    let most: number = table[ray]!;
    for (let shift: number = low; shift <= high + 1e-9; shift += width) {
      const from: number =
        (Math.round(ray - shift / width) % swingTwistBasis.RAYS +
          swingTwistBasis.RAYS) %
        swingTwistBasis.RAYS;
      most = Math.max(most, table[from]!);
    }
    turned[ray] = most;
  }
  return turned;
}

/**
 * Where the region's edge runs along a ray the farthest reach jumps between
 * two rays, and a projection along the rays would jump with it. So the radius
 * is raised to the least function at or above it that turns no faster than
 * `SLOPE` degrees of radius per degree of azimuth: the region gains a sliver
 * beside such an edge and loses nothing.
 */
function raise(table: Float64Array): Float64Array {
  const raised: Float64Array = new Float64Array(swingTwistBasis.RAYS);
  const width: number = 360 / swingTwistBasis.RAYS;
  for (let ray: number = 0; ray < swingTwistBasis.RAYS; ++ray) {
    let most: number = 0;
    for (let other: number = 0; other < swingTwistBasis.RAYS; ++other) {
      const apart: number = Math.min(
        Math.abs(ray - other),
        swingTwistBasis.RAYS - Math.abs(ray - other),
      );
      most = Math.max(most, table[other]! - SLOPE * apart * width);
    }
    raised[ray] = Math.min(180, most);
  }
  return raised;
}

/**
 * Whether the flexion and abduction intervals, with no twist and within the
 * swing cone, reach a direction in either reading. With no twist the rotation
 * is the abduction's after the flexion's, in either order of the twist: the
 * flexion turns `u` within the plane normal to the flexion axis, and the
 * abduction then turns it about its own axis, which keeps the part along that
 * axis, so that part gives the flexion twice and the abduction follows for
 * each.
 */
function reached(
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRegion.IJoint,
  basis: swingTwistBasis.IBasis,
  direction: IAutoMovieVector3,
): boolean {
  const flexion: IAutoMovieAngleRange = constraint.flexion!;
  const abduction: IAutoMovieAngleRange = constraint.abduction!;
  const admits = (rigFlexion: number, rigAbduction: number): boolean => {
    const f: number = swingTwistBasis.alias(
      toClinicalAngle(rigFlexion, joint.frame?.flexion)!,
      flexion,
    );
    const a: number = swingTwistBasis.alias(
      toClinicalAngle(rigAbduction, joint.frame?.abduction)!,
      abduction,
    );
    return (
      f >= flexion.min &&
      f <= flexion.max &&
      a >= abduction.min &&
      a <= abduction.max &&
      (typeof constraint.swingDeg !== "number" ||
        swingConeAngle(f, a) <= constraint.swingDeg)
    );
  };
  const across: number = Vector3.dot(
    Vector3.cross(basis.f, basis.u),
    basis.a,
  );
  const first: number =
    Math.asin(
      swingTwistBasis.clamp(Vector3.dot(direction, basis.a) / across, -1, 1),
    ) * swingTwistBasis.DEG;
  for (const f of [first, 180 - first]) {
    const swung: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle(basis.f, f),
      basis.u,
    );
    const from: IAutoMovieVector3 = flat(swung, basis.a);
    const to: IAutoMovieVector3 = flat(direction, basis.a);
    if (Vector3.length(from) < 1e-9 || Vector3.length(to) < 1e-9) {
      // On the abduction axis any abduction keeps the direction.
      for (const a of [
        abduction.min,
        abduction.max,
        (abduction.min + abduction.max) / 2,
      ])
        if (admits(f, toRigAngle(a, joint.frame?.abduction)!)) return true;
      continue;
    }
    const a: number =
      Math.atan2(
        Vector3.dot(basis.a, Vector3.cross(from, to)),
        Vector3.dot(from, to),
      ) * swingTwistBasis.DEG;
    if (admits(f, a)) return true;
  }
  return false;
}

/** A vector with its part along a unit axis taken off. */
function flat(
  v: IAutoMovieVector3,
  axis: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
}
