import {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { swingConeAngle } from "../rom/swingConeAngle";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { normalizeJointAxes } from "./normalizeJointAxes";

const DEG: number = 180 / Math.PI;

/**
 * The range of a ball joint read by swing and twist: where the limb's long
 * axis may point, and how far the limb may turn about it.
 *
 * A joint rotation `q`, rest-relative in the bone's own frame, splits into a
 * twist about the limb's rest axis `u` (the joint's twist axis) taken first
 * and a swing, the shortest turn that carries `u` to the limb's direction
 * `q u`. The twist is that turn's angle about `u`, lifted to clinical degrees
 * by the rest frame's twist mapping. The decomposition is singular only where
 * the limb points at `-u`, the rest direction's antipode.
 *
 * The swing is limited by the directions the constraint's `flexion` and
 * `abduction` intervals reach with no twist (and its `swingDeg`, when it has
 * one), taken as a star about the rest direction: every direction between
 * the rest direction and a reached one, along the great circle through both.
 * Through a three-angle chart the reached directions pinch where two of the
 * angles turn about one axis (a hip flexed to 90 degrees, where abduction
 * turns the thigh about itself), and the star fills the pinch, so a flexed
 * hip may still swing aside. The star is stored as its radius along each
 * great circle leaving the rest direction, `RAYS` of them, the farthest swing
 * along it that the ranges reach, raised where it would turn faster than
 * `SLOPE` with the azimuth (beside an edge of the region that runs along a
 * ray, where the farthest reach jumps), and interpolated linearly between
 * rays. A direction outside is brought back along its own great circle to
 * the radius there, which moves continuously with the direction because the
 * radius does.
 *
 * The twist is limited by the constraint's `swingTwist.twist` interval, and
 * clamped to it. A clamp of a turn onto an arc must break somewhere on the
 * circle: here at the turn farthest from the interval on either side, which
 * no limb reaches.
 *
 * The construction is this module's; no published method is claimed for it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the decomposition, its singular direction, how the swing region is read from the constraint, how a direction outside it is brought back and the premise that keeps that continuous.
 * @evidence contracts/development/design.md#principled-representation A rotation is split into the two quantities a ball joint's range limits independently, where the limb points and how it is turned about itself, neither read through a three-angle chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading, the measure outside the range and the projection into it; the radius table is cached per constraint and basis.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named: the axes, the rest frame and the intervals are the caller's.
 */
export namespace swingTwistRange {
  /** The great circles from the rest direction the swing region's radius is read on. */
  export const RAYS: number = 360;

  /**
   * A rotation read by swing and twist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit: the limb's unit direction in the rest frame, the swing in degrees, the azimuth in degrees about the rest direction from the flexion axis and the clinical twist in (-180, 180].
   * @evidence contracts/development/design.md#principled-representation The two quantities a ball joint's range limits independently, where the limb points (the direction with its swing and azimuth) and how it is turned about itself (the twist), in degrees and the bone's rest frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `overshoot`, `room` and `project`; the direction is kept so `project` need not recompute it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither the swing nor the twist is read through a three-angle chart; the record names no joint and no bone.
   */
  export interface IReading {
    /** The limb's direction, unit, in the bone's rest frame. */
    direction: IAutoMovieVector3;

    /** The angle from the rest direction to the limb's direction, degrees. */
    swing: number;

    /** The great circle the direction lies on, degrees about the rest direction from the flexion axis. */
    azimuth: number;

    /** The twist about the rest direction, clinical degrees in (-180, 180]. */
    twist: number;
  }

  /**
   * The joint's frame: its axes and its rest frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the axes are the joint's clinical basis and that the rest frame lifts its angles, and that an absent frame leaves angles rest-relative.
   * @evidence contracts/development/design.md#principled-representation The caller's clinical axis basis and rest frame, the two things that turn a rotation's angles into the joint's clinical ones; both come from `@automovie/interface` and the engine's rest frame type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by every function here; the radius table is cached on them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint or bone is named, and no type is duplicated.
   */
  export interface IJoint {
    /** The joint's clinical axes. */
    axes: IAutoMovieJointAxes;

    /** The rest frame its clinical angles are lifted by. */
    frame?: IAutoMovieRestFrame | undefined;
  }

  /**
   * A rotation read by swing and twist.
   *
   * @param q The joint's rest-relative rotation.
   * @param joint The joint's axes and rest frame.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, its frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The twist is the angle of the quaternion's part about the rest axis (the swing-twist split), so the swing that remains carries the rest axis to the limb's direction by the shortest turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation of the axis, one projection and two angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The twist is lifted by the joint's own rest frame, so its sign is the clinical one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function read(q: IAutoMovieQuaternion, joint: IJoint): IReading {
    const basis: IBasis = basisOf(joint);
    const unit: IAutoMovieQuaternion = Quaternion.normalize(q);
    const direction: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(unit, basis.u),
    );
    const along: number =
      unit.x * basis.u.x + unit.y * basis.u.y + unit.z * basis.u.z;
    const rig: number = 2 * Math.atan2(along, unit.w) * DEG;
    return {
      direction,
      swing: Math.acos(clamp(Vector3.dot(direction, basis.u), -1, 1)) * DEG,
      azimuth: azimuthOf(basis, direction),
      twist: wrap(toClinicalAngle(wrap(rig), joint.frame?.twist)!),
    };
  }

  /**
   * How far a rotation lies outside a swing-twist range, degrees: the swing
   * past the region's radius on its great circle plus the twist past its
   * interval.
   *
   * @param q The joint's rest-relative rotation.
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns Degrees; 0 inside the range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two parts of the measure and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation Degrees past the swing's radius and past the twist's interval, the two limits the range states, so a solver ranks candidates by how far out they are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one radius and one interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The twist is aliased to the interval before it is measured, so a full turn is never counted.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work once the radius table is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `read` and the cached `radius`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function overshoot(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): number {
    const reading: IReading = read(q, joint);
    const twist: IAutoMovieAngleRange = constraint.swingTwist!.twist;
    const turned: number = alias(reading.twist, twist);
    return (
      Math.max(
        0,
        reading.swing - radius(constraint, joint, reading.azimuth),
      ) + Math.max(0, twist.min - turned, turned - twist.max)
    );
  }

  /**
   * How far a rotation lies inside a swing-twist range, degrees: the least
   * of the swing's room to the region's radius on its great circle and the
   * twist's room to either end of its interval; negative outside, where it
   * is the larger of the two parts `overshoot` adds, negated.
   *
   * @param q The joint's rest-relative rotation.
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns Degrees; positive inside, 0 on the edge, negative outside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the parts, their unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The same two limits `overshoot` measures past, measured from inside, so a caller can keep a joint a margin inside its range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one radius and one interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The twist is aliased to the interval as `overshoot` aliases it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work once the radius table is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `read` and the cached `radius`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function room(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): number {
    const reading: IReading = read(q, joint);
    const twist: IAutoMovieAngleRange = constraint.swingTwist!.twist;
    const turned: number = alias(reading.twist, twist);
    return Math.min(
      radius(constraint, joint, reading.azimuth) - reading.swing,
      turned - twist.min,
      twist.max - turned,
    );
  }

  /**
   * A rotation brought into a swing-twist range: its direction brought back
   * along its great circle from the rest direction to the region's radius
   * there, and its twist clamped to its interval. A rotation inside is
   * returned unchanged.
   *
   * @param q The joint's rest-relative rotation.
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns The rotation in range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the swing and the twist are each brought back and that a rotation inside is returned as given.
   * @evidence contracts/development/implementation.md#principled-implementation The swing is brought back along its own great circle from the rest direction, a radial map onto a region star-shaped about the rest direction, which moves continuously with the rotation wherever the radius does; the twist is clamped to its interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one radius, one shortest turn and one twist.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest point is sought, since a nearest point jumps where two tie.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work once the radius table is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `read` and `radius`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function project(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): IAutoMovieQuaternion {
    const basis: IBasis = basisOf(joint);
    const reading: IReading = read(q, joint);
    const interval: IAutoMovieAngleRange = constraint.swingTwist!.twist;
    const turned: number = alias(reading.twist, interval);
    const twist: number = clamp(turned, interval.min, interval.max);
    const limit: number = radius(constraint, joint, reading.azimuth);
    if (reading.swing <= limit && twist === turned) return q;
    const swing: number = Math.min(reading.swing, limit);
    const direction: IAutoMovieVector3 =
      swing === reading.swing
        ? reading.direction
        : directionAt(basis, swing, reading.azimuth);
    return Quaternion.normalize(
      Quaternion.multiply(
        arc(basis.u, direction),
        Quaternion.fromAxisAngle(
          basis.u,
          toRigAngle(twist, joint.frame?.twist)!,
        ),
      ),
    );
  }

  /**
   * The swing region's radius on one great circle, degrees, read off the
   * cached table by linear interpolation between its two nearest rays.
   *
   * @param constraint The constraint.
   * @param joint The joint's axes and rest frame.
   * @param azimuth The great circle, degrees about the rest direction from the flexion axis.
   * @returns The radius, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reading and its interpolation.
   * @evidence contracts/development/implementation.md#principled-implementation The radius is read on `RAYS` great circles once, from the farthest reached swing on each, found by a scan from the far end and a bisection, widened for a proximal twist by the reach of every twist in its interval, raised to turn no faster than `SLOPE` with the azimuth, and interpolated linearly between them, which is continuous in the azimuth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table lookup and one interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scan runs from the far end, so a ray the ranges leave and re-enter keeps its farthest reach: the radius is the star's, not the first exit's. `SLOPE` (3) is provisional; `SCAN` and `HALVINGS` are resolutions, not fitted to a case.
   * @evidence contracts/development/implementation.md#efficient-algorithms The table is built once per constraint and basis and kept.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every call after the first reads the cached table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The tables are kept in a WeakMap keyed by the constraint object and released with it.
   */
  export function radius(
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
    azimuth: number,
  ): number {
    const table: Float64Array = tableOf(constraint, joint);
    const at: number = (((azimuth % 360) + 360) % 360) / (360 / RAYS);
    const before: number = Math.floor(at) % RAYS;
    const after: number = (before + 1) % RAYS;
    const share: number = at - Math.floor(at);
    return table[before]! + (table[after]! - table[before]!) * share;
  }
}

/** A joint's unit axes: `u` its limb's rest direction (the twist axis), `f` and `a` its flexion and abduction axes, `w` the flexion's turn of `u`. */
interface IBasis {
  u: IAutoMovieVector3;
  f: IAutoMovieVector3;
  a: IAutoMovieVector3;
  e1: IAutoMovieVector3;
  e2: IAutoMovieVector3;
}

function basisOf(joint: swingTwistRange.IJoint): IBasis {
  const axes: IAutoMovieJointAxes = normalizeJointAxes(
    joint.axes,
    "swingTwistRange axes",
  );
  const u: IAutoMovieVector3 = axes.twist;
  const e1: IAutoMovieVector3 = axes.flexion;
  return {
    u,
    f: axes.flexion,
    a: axes.abduction,
    e1,
    e2: Vector3.cross(u, e1),
  };
}

/** The great circle a direction lies on, degrees about the rest direction from `e1`. */
function azimuthOf(basis: IBasis, direction: IAutoMovieVector3): number {
  return (
    Math.atan2(
      Vector3.dot(direction, basis.e2),
      Vector3.dot(direction, basis.e1),
    ) * DEG
  );
}

/** The direction a swing of some degrees along a great circle reaches. */
function directionAt(
  basis: IBasis,
  swing: number,
  azimuth: number,
): IAutoMovieVector3 {
  const s: number = swing / DEG;
  const t: number = azimuth / DEG;
  return Vector3.add(
    Vector3.scale(basis.u, Math.cos(s)),
    Vector3.add(
      Vector3.scale(basis.e1, Math.sin(s) * Math.cos(t)),
      Vector3.scale(basis.e2, Math.sin(s) * Math.sin(t)),
    ),
  );
}

/** The shortest turn from one unit direction to another. */
function arc(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const axis: IAutoMovieVector3 = Vector3.cross(from, to);
  const sine: number = Vector3.length(axis);
  const cosine: number = Vector3.dot(from, to);
  if (sine < 1e-12) return Quaternion.identity();
  return Quaternion.fromAxisAngle(
    Vector3.scale(axis, 1 / sine),
    Math.atan2(sine, cosine) * DEG,
  );
}

/** The radius tables, per constraint and per basis. */
const TABLES: WeakMap<
  IAutoMovieJointConstraint,
  Map<string, Float64Array>
> = new WeakMap();

function tableOf(
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRange.IJoint,
): Float64Array {
  let byJoint: Map<string, Float64Array> | undefined = TABLES.get(constraint);
  if (byJoint === undefined) {
    byJoint = new Map();
    TABLES.set(constraint, byJoint);
  }
  const key: string = JSON.stringify([joint.axes, joint.frame ?? null]);
  let table: Float64Array | undefined = byJoint.get(key);
  if (table === undefined) {
    table = build(constraint, joint);
    byJoint.set(key, table);
  }
  return table;
}

/**
 * The region's radius on each ray: the farthest swing along it at which the
 * flexion and abduction intervals reach the direction, found by a scan from
 * the far end in `SCAN` degree steps toward the rest direction and refined
 * by `HALVINGS` bisections.
 */
function build(
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRange.IJoint,
): Float64Array {
  const basis: IBasis = basisOf(joint);
  const table: Float64Array = new Float64Array(swingTwistRange.RAYS);
  for (let ray: number = 0; ray < swingTwistRange.RAYS; ++ray) {
    const azimuth: number = (360 * ray) / swingTwistRange.RAYS;
    const inside = (swing: number): boolean =>
      reached(constraint, joint, basis, directionAt(basis, swing, azimuth));
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
  // A proximal twist turns about the rest axis outside the flexion and the
  // abduction, so it carries every reached direction around the rest
  // direction by its own angle: on a hip flexed forward it swings the thigh
  // sideways. The directions its interval reaches are then those of no
  // twist turned by any twist in it, which shifts each ray's reach along the
  // azimuth.
  const twist: IAutoMovieAngleRange | null = constraint.twist;
  if (joint.axes.twistPlacement !== "distal" && twist !== null) {
    const ends: readonly number[] = [
      toRigAngle(twist.min, joint.frame?.twist)!,
      toRigAngle(twist.max, joint.frame?.twist)!,
    ];
    const low: number = Math.min(...ends);
    const high: number = Math.max(...ends);
    const width: number = 360 / swingTwistRange.RAYS;
    const turned: Float64Array = new Float64Array(swingTwistRange.RAYS);
    for (let ray: number = 0; ray < swingTwistRange.RAYS; ++ray) {
      let most: number = table[ray]!;
      for (let shift: number = low; shift <= high + 1e-9; shift += width) {
        const from: number =
          (((Math.round(ray - shift / width) % swingTwistRange.RAYS) +
            swingTwistRange.RAYS) %
            swingTwistRange.RAYS);
        most = Math.max(most, table[from]!);
      }
      turned[ray] = most;
    }
    table.set(turned);
  }
  // Where the region's edge runs along a ray the farthest reach jumps
  // between two rays, and a projection along the rays would jump with it.
  // So the radius is raised to the least function at or above it that turns
  // no faster than `SLOPE` degrees of radius per degree of azimuth: the
  // region gains a sliver beside such an edge and loses nothing.
  const raised: Float64Array = new Float64Array(swingTwistRange.RAYS);
  const width: number = 360 / swingTwistRange.RAYS;
  for (let ray: number = 0; ray < swingTwistRange.RAYS; ++ray) {
    let most: number = 0;
    for (let other: number = 0; other < swingTwistRange.RAYS; ++other) {
      const apart: number = Math.min(
        Math.abs(ray - other),
        swingTwistRange.RAYS - Math.abs(ray - other),
      );
      most = Math.max(most, table[other]! - SLOPE * apart * width);
    }
    raised[ray] = Math.min(180, most);
  }
  return raised;
}

/** The fastest the region's radius may change with the azimuth, degrees per degree (provisional: three, so a projection's step is at most about three times the azimuth's step). */
const SLOPE: number = 3;

/** The step of the scan for the farthest reached swing on a ray, degrees. */
const SCAN: number = 0.5;

/** The bisections that refine it: twenty halve half a degree to under a millionth. */
const HALVINGS: number = 20;

/**
 * Whether the flexion and abduction intervals, with no twist and within the
 * swing cone, reach a direction in either reading. With no twist the
 * rotation is the abduction's after the flexion's, in either order of the
 * twist: the flexion turns `u` within the plane normal to the flexion axis,
 * and the abduction then turns it about its own axis, which keeps the part
 * along that axis, so that part gives the flexion twice and the abduction
 * follows for each.
 */
function reached(
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRange.IJoint,
  basis: IBasis,
  direction: IAutoMovieVector3,
): boolean {
  const flexion: IAutoMovieAngleRange = constraint.flexion!;
  const abduction: IAutoMovieAngleRange = constraint.abduction!;
  const admits = (rigFlexion: number, rigAbduction: number): boolean => {
    const f: number = alias(
      toClinicalAngle(rigFlexion, joint.frame?.flexion)!,
      flexion,
    );
    const a: number = alias(
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
    Math.asin(clamp(Vector3.dot(direction, basis.a) / across, -1, 1)) * DEG;
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
      ) * DEG;
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
/** An angle's full-turn alias nearest an interval, the one inside it when any is. */
function alias(angle: number, range: IAutoMovieAngleRange): number {
  const middle: number = (range.min + range.max) / 2;
  const near: number = angle - 360 * Math.round((angle - middle) / 360);
  if (near >= range.min && near <= range.max) return near;
  for (const other of [near - 360, near + 360])
    if (other >= range.min && other <= range.max) return other;
  return near;
}

function wrap(degrees: number): number {
  const turned: number = degrees - 360 * Math.round(degrees / 360);
  return turned === -180 ? 180 : turned;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
