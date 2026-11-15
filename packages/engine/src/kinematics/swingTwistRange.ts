import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { positiveModulo } from "../math/positiveModulo";
import { rotationBetween } from "../math/rotationBetween";
import { swingTwist } from "../math/swingTwist";
import { wrapDegrees } from "../math/wrapDegrees";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { HUMANOID_REST_FRAME } from "../rom/constants/HUMANOID_REST_FRAME";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { HUMANOID_JOINT_AXES } from "./constants/HUMANOID_JOINT_AXES";
import { skeletonJointAxes } from "./skeletonJointAxes";
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
 * great circle leaving the rest direction, `swingTwistBasis.RAYS` of them, the farthest swing
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The joint frame of a rig's bone, the reading, the measure outside the range, the projection into it and the radius on a circle; the radius table is cached per constraint and basis.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named: the axes, the rest frame and the intervals are the caller's.
 */
export namespace swingTwistRange {
  /**
   * A rotation read by swing and twist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit: the limb's unit direction in the rest frame, the swing in degrees, the azimuth in degrees about the rest direction from the flexion axis and the clinical twist in [-180, 180).
   * @evidence contracts/development/design.md#principled-representation The two quantities a ball joint's range limits independently, where the limb points (the direction with its swing and azimuth) and how it is turned about itself (the twist), in degrees and the bone's rest frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `overshoot` and `project`; the direction is kept so `project` need not recompute it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither the swing nor the twist is read through a three-angle chart; the record names no joint and no bone.
   */
  export interface IReading {
    /** The limb's direction, unit, in the bone's rest frame. */
    direction: IAutoMovieVector3;

    /** The angle from the rest direction to the limb's direction, degrees. */
    swing: number;

    /** The great circle the direction lies on, degrees about the rest direction from the flexion axis. */
    azimuth: number;

    /** The twist about the rest direction, clinical degrees in [-180, 180). */
    twist: number;
  }

  /**
   * The joint's frame: its axes and its rest frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the axes are the joint's clinical basis and that the rest frame lifts its angles, and that an absent frame leaves angles rest-relative.
   * @evidence contracts/development/design.md#principled-representation The caller's clinical axis basis and rest frame, the two things that turn a rotation's angles into the joint's clinical ones; both come from `@automovie/interface` and the engine's rest frame type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by every function here; the radius table is cached on them; `of` gives them for a rig's bone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint or bone is named, and no type is duplicated.
   */
  export interface IJoint {
    /** The joint's clinical axes. */
    axes: IAutoMovieJointAxes;

    /** The rest frame its clinical angles are lifted by. */
    frame?: IAutoMovieRestFrame | undefined;
  }

  /**
   * The frame a rig's bone is read in: its clinical axes as the skeleton
   * resolves them (`skeletonJointAxes`, the bone's own declaration over the
   * humanoid table) and the humanoid rest frame; the humanoid table's axes
   * when no skeleton is given.
   *
   * @param bone The bone.
   * @param skeleton The rig; the humanoid tables alone when absent.
   * @returns The frame; none for a bone that has no axes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the precedence, the fallback and the empty case.
   * @evidence contracts/development/implementation.md#principled-implementation The skeleton's own axes win over the family table, the precedence every engine entry with a skeleton reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table read and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms The frames of a skeleton are resolved once, by one scan of its bones, and read by every later call: a limb fit clamps its candidates through here twice per swivel candidate, where a scan per call cost about 8 percent of a sweep cell.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `skeletonJointAxes`, once per skeleton and bones list.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frames are kept in a weak map keyed by the skeleton, released with it, and resolved again when its bones list is replaced; a bone's axes changed in place on a list already read are not seen.
   */
  export function of(
    bone: AutoMovieHumanoidBone,
    skeleton?: IAutoMovieSkeleton,
  ): IJoint | undefined {
    const key: object = skeleton ?? NO_SKELETON;
    let kept: IKept | undefined = FRAMES.get(key);
    if (
      kept === undefined ||
      (skeleton !== undefined && kept.bones !== skeleton.bones)
    ) {
      kept = {
        bones: skeleton?.bones,
        table:
          skeleton === undefined
            ? HUMANOID_JOINT_AXES
            : skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES),
        frames: new Map(),
      };
      FRAMES.set(key, kept);
    }
    if (kept.frames.has(bone)) return kept.frames.get(bone);
    const axes: IAutoMovieJointAxes | undefined = kept.table[bone];
    const frame: IJoint | undefined =
      axes === undefined
        ? undefined
        : { axes, frame: HUMANOID_REST_FRAME[bone] };
    kept.frames.set(bone, frame);
    return frame;
  }

  /** A skeleton's axes table and the bone frames already read from it, with the bones list the table was resolved from. */
  interface IKept {
    bones: unknown;
    table: ReturnType<typeof skeletonJointAxes>;
    frames: Map<AutoMovieHumanoidBone, IJoint | undefined>;
  }

  /** The kept tables, per skeleton (or the humanoid tables, keyed by `NO_SKELETON`). */
  const FRAMES: WeakMap<object, IKept> = new WeakMap();

  /** The key of the humanoid tables read with no skeleton. */
  const NO_SKELETON: object = Object.freeze({});

  /**
   * A rotation read by swing and twist.
   *
   * @param q The joint's rest-relative rotation.
   * @param joint The joint's axes and rest frame.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, its frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The twist is the angle of the rotation's twist about the rest axis (the engine's `swingTwist`), so the swing that remains carries the rest axis to the limb's direction by the shortest turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation of the axis, one projection and two angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The twist is lifted by the joint's own rest frame, so its sign is the clinical one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `swingTwist` and `wrapDegrees`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function read(q: IAutoMovieQuaternion, joint: IJoint): IReading {
    const basis: swingTwistBasis.IBasis = swingTwistBasis.of(joint.axes);
    const unit: IAutoMovieQuaternion = Quaternion.normalize(q);
    const direction: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(unit, basis.u),
    );
    const twisted: IAutoMovieQuaternion = swingTwist(unit, basis.u).twist;
    const rig: number =
      2 *
      Math.atan2(
        twisted.x * basis.u.x + twisted.y * basis.u.y + twisted.z * basis.u.z,
        twisted.w,
      ) *
      DEG;
    return {
      direction,
      swing:
        Math.acos(
          swingTwistBasis.clamp(Vector3.dot(direction, basis.u), -1, 1),
        ) * DEG,
      azimuth: swingTwistBasis.azimuth(basis, direction),
      twist: wrapDegrees(
        toClinicalAngle(wrapDegrees(rig), joint.frame?.twist)!,
      ),
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
    const turned: number = nearestAngleAlias(reading.twist, twist);
    return (
      Math.max(0, reading.swing - radius(constraint, joint, reading.azimuth)) +
      Math.max(0, twist.min - turned, turned - twist.max)
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one radius, one shortest turn (`rotationBetween`) and one twist.
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
    const turned: number = nearestAngleAlias(reading.twist, interval);
    const twist: number = swingTwistBasis.clamp(
      turned,
      interval.min,
      interval.max,
    );
    const limit: number = radius(constraint, joint, reading.azimuth);
    if (reading.swing <= limit && twist === turned) return q;
    const swing: number = Math.min(reading.swing, limit);
    const direction: IAutoMovieVector3 =
      swing === reading.swing
        ? reading.direction
        : swingTwistBasis.direction(basis, swing, reading.azimuth);
    return Quaternion.normalize(
      Quaternion.multiply(
        rotationBetween(basis.u, direction),
        Quaternion.fromAxisAngle(
          basis.u,
          toRigAngle(twist, joint.frame?.twist)!,
        ),
      ),
    );
  }

  /**
   * A rotation's place in the range's chart: its swing as a share of the
   * region's radius on its own great circle, laid out on the unit disc by its
   * azimuth (`x`, `y`), and its twist read inside the interval (`twist`). The
   * region is star-shaped about the rest direction with a radius below 180
   * degrees on every great circle (`ISwingTwist.reach`), so the region is the
   * unit disc exactly, the rest direction its centre, and the chart is
   * continuous and one to one over it: the rest direction's antipode, where a
   * direction has no azimuth and a rotation no twist, lies outside.
   *
   * @param q The joint's rest-relative rotation.
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns The disc coordinates and the twist, clinical degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three coordinates, why the region is the unit disc and why the chart is continuous over it.
   * @evidence contracts/development/implementation.md#principled-implementation A star-shaped region about a pole is mapped onto the unit disc by the swing's share of its radius along the azimuth, the polar form of the pole's chart, whose only singularity, the pole's antipode, lies outside the region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one radius and two products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The twist is the reading's alias nearest the interval, never clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work once the radius table is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `read`, `radius` and `nearestAngleAlias`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function chart(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): { x: number; y: number; twist: number } {
    const reading: IReading = read(q, joint);
    const k: number =
      reading.swing / radius(constraint, joint, reading.azimuth);
    const turn: number = reading.azimuth / DEG;
    return {
      x: k * Math.cos(turn),
      y: k * Math.sin(turn),
      twist: nearestAngleAlias(reading.twist, constraint.swingTwist!.twist),
    };
  }

  /**
   * The rotation at a place of the range's chart (`chart`), its inverse.
   *
   * @param place The disc coordinates and the twist, clinical degrees.
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns The joint's rest-relative rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The direction the swing of the disc's share of the radius reaches along the disc's azimuth, then the twist about the rest axis, composed as `project` composes a rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One azimuth, one radius, one direction and one composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A place off the disc gives a rotation outside the region, never a clamped one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work once the radius table is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `radius`, `swingTwistBasis.direction`, `rotationBetween` and `toRigAngle`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function placed(
    place: { x: number; y: number; twist: number },
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): IAutoMovieQuaternion {
    const basis: swingTwistBasis.IBasis = swingTwistBasis.of(joint.axes);
    const k: number = Math.hypot(place.x, place.y);
    const azimuth: number = k > 1e-12 ? Math.atan2(place.y, place.x) * DEG : 0;
    return Quaternion.normalize(
      Quaternion.multiply(
        rotationBetween(
          basis.u,
          swingTwistBasis.direction(
            basis,
            k * radius(constraint, joint, azimuth),
            azimuth,
          ),
        ),
        Quaternion.fromAxisAngle(
          basis.u,
          toRigAngle(place.twist, joint.frame?.twist)!,
        ),
      ),
    );
  }

  /**
   * A rotation part of the way between two, blended in the range's chart
   * (`chart`): the two places moved straight across the unit disc and the
   * twist straight between the two. The disc and the interval are convex, so
   * two ends inside the range give a blend inside it at every share; the
   * chart is continuous and one to one over the region, so the blend is
   * continuous in its share and in both ends, and meets each end exactly.
   *
   * A spherical interpolation of the two rotations leaves the region where it
   * is not convex: a shoulder carried from a hanging arm to a hand on the nape
   * ran 40 degrees outside it, and its projection onto a radius that rose from
   * 68.5 to 106.7 degrees over 16 degrees of azimuth moved the elbow 200 to
   * 690 mm in a frame.
   *
   * @param a The joint's rest-relative rotation at share 0.
   * @param b The same at share 1.
   * @param share How far from `a` to `b`, in [0, 1].
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns The rotation: inside the range when both ends are.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blend, why it stays inside and is continuous and meets its ends, and the measured defect of the spherical interpolation.
   * @evidence contracts/development/implementation.md#principled-implementation A straight line between two points of a convex set stays in it, and the chart is a homeomorphism of the region onto the disc times the interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two charts, one straight blend and one inverse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No projection is needed and none is taken.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work once the radius table is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `chart` and `placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function blend(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    share: number,
    constraint: IAutoMovieJointConstraint,
    joint: IJoint,
  ): IAutoMovieQuaternion {
    const from: { x: number; y: number; twist: number } = chart(
      a,
      constraint,
      joint,
    );
    const to: { x: number; y: number; twist: number } = chart(
      b,
      constraint,
      joint,
    );
    return placed(
      {
        x: from.x + (to.x - from.x) * share,
        y: from.y + (to.y - from.y) * share,
        twist: from.twist + (to.twist - from.twist) * share,
      },
      constraint,
      joint,
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
   * @evidence contracts/development/implementation.md#principled-implementation The radius is read on `swingTwistBasis.RAYS` great circles once, from the farthest reached swing on each, found by a scan from the far end and a bisection, widened for a proximal twist by the reach of every twist in its interval, raised to turn no faster than `SLOPE` with the azimuth, and interpolated linearly between them, which is continuous in the azimuth.
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
    const rays: number = swingTwistBasis.RAYS;
    const at: number = positiveModulo(azimuth, 360) / (360 / rays);
    const before: number = Math.floor(at) % rays;
    const after: number = (before + 1) % rays;
    const share: number = at - Math.floor(at);
    return table[before]! + (table[after]! - table[before]!) * share;
  }
}
