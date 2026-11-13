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
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { swingTwistBasis } from "./swingTwistBasis";
import { swingTwistRegion } from "./swingTwistRegion";

const DEG: number = swingTwistBasis.DEG;

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
  export const RAYS: number = swingTwistBasis.RAYS;

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
    const basis: swingTwistBasis.IBasis = swingTwistBasis.of(joint.axes);
    const unit: IAutoMovieQuaternion = Quaternion.normalize(q);
    const direction: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(unit, basis.u),
    );
    const along: number =
      unit.x * basis.u.x + unit.y * basis.u.y + unit.z * basis.u.z;
    const rig: number = 2 * Math.atan2(along, unit.w) * DEG;
    return {
      direction,
      swing: Math.acos(swingTwistBasis.clamp(Vector3.dot(direction, basis.u), -1, 1)) * DEG,
      azimuth: swingTwistBasis.azimuth(basis, direction),
      twist: swingTwistBasis.wrap(toClinicalAngle(swingTwistBasis.wrap(rig), joint.frame?.twist)!),
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
    const turned: number = swingTwistBasis.alias(reading.twist, twist);
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
    const turned: number = swingTwistBasis.alias(reading.twist, twist);
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
    const basis: swingTwistBasis.IBasis = swingTwistBasis.of(joint.axes);
    const reading: IReading = read(q, joint);
    const interval: IAutoMovieAngleRange = constraint.swingTwist!.twist;
    const turned: number = swingTwistBasis.alias(reading.twist, interval);
    const twist: number = swingTwistBasis.clamp(turned, interval.min, interval.max);
    const limit: number = radius(constraint, joint, reading.azimuth);
    if (reading.swing <= limit && twist === turned) return q;
    const swing: number = Math.min(reading.swing, limit);
    const direction: IAutoMovieVector3 =
      swing === reading.swing
        ? reading.direction
        : swingTwistBasis.direction(basis, swing, reading.azimuth);
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
    const table: Float64Array = swingTwistRegion.table(constraint, joint);
    const at: number = (((azimuth % 360) + 360) % 360) / (360 / RAYS);
    const before: number = Math.floor(at) % RAYS;
    const after: number = (before + 1) % RAYS;
    const share: number = at - Math.floor(at);
    return table[before]! + (table[after]! - table[before]!) * share;
  }
}

/** A joint's unit axes: `u` its limb's rest direction (the twist axis), `f` and `a` its flexion and abduction axes, `w` the flexion's turn of `u`. */

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
