import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame as IAutoMoviePlainJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSwingTwistBasis,
  IAutoMovieSwingTwistChartPosition,
  IAutoMovieSwingTwistRange,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { positiveModulo } from "../math/positiveModulo";
import { rotationBetween } from "../math/rotationBetween";
import { swingTwist } from "../math/swingTwist";
import { wrapDegrees } from "../math/wrapDegrees";
import { DEFAULT_HUMANOID_ROM } from "../rom/constants/DEFAULT_HUMANOID_ROM";
import { HUMANOID_REST_FRAME } from "../rom/constants/HUMANOID_REST_FRAME";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { HUMANOID_JOINT_AXES } from "./constants/HUMANOID_JOINT_AXES";
import { placeSwingTwistChart } from "./placeSwingTwistChart";
import { skeletonJointAxes } from "./skeletonJointAxes";
import { swingTwistBasis } from "./swingTwistBasis";
import { swingTwistRegion } from "./swingTwistRegion";

const DEG: number = swingTwistBasis.DEG;

/**
 * A joint's axes and rest frame, optionally carrying the swing region prepared
 * for its constraint (`swingTwistRange.prepare`).
 */
type IAutoMovieJointRotationFrame = IAutoMoviePlainJointRotationFrame &
  swingTwistRegion.IRegional;

/** The twist `swingTwist` gives where the projection vanishes: the identity. */
const IDENTITY_TWIST: IAutoMovieQuaternion = Quaternion.identity();

/** Original dimensionless disc coordinates and clinical-degree twist. */
type IChart = ReturnType<typeof swingTwistRange.chart>;

/**
 * The humanoid tables' own frame of every bone whose default constraint gates
 * it by swing and twist, prepared once with its region.
 */
const HUMANOID_RANGES: ReadonlyMap<string, IAutoMovieJointRotationFrame> =
  new Map(
    Object.entries(DEFAULT_HUMANOID_ROM).flatMap(
      ([bone, constraint]: [
        string,
        IAutoMovieJointConstraint | undefined,
      ]): [string, IAutoMovieJointRotationFrame][] => {
        const axes: IAutoMovieJointAxes | undefined = new Map(
          Object.entries(HUMANOID_JOINT_AXES),
        ).get(bone);
        const frame: IAutoMovieRestFrame | undefined = new Map(
          Object.entries(HUMANOID_REST_FRAME),
        ).get(bone);
        if (
          axes === undefined ||
          constraint === undefined ||
          constraint.swingTwist === undefined ||
          constraint.swingTwist === null
        )
          return [];
        const joint: IAutoMoviePlainJointRotationFrame = { axes, frame };
        return [
          [
            bone,
            { ...joint, region: swingTwistRegion.prepare(constraint, joint) },
          ],
        ];
      },
    ),
  );

/**
 * The range of a ball joint read by swing and twist: where the limb's long axis
 * may point, and how far the limb may turn about it.
 *
 * A joint rotation q, rest-relative in the bone's own frame, splits into a
 * twist about its rest axis u (the joint's twist axis) taken first and a swing,
 * the shortest turn carrying u to the limb's direction q u. The twist is that
 * turn's angle about u, lifted to clinical degrees by the rest frame's twist
 * map. Decomposition is singular only where the limb points at -u, the rest
 * direction's antipode.
 *
 * Swing is limited by directions the constraint's flexion/abduction intervals
 * reach with no twist (and swingDeg, when present), taken as a star about rest:
 * every direction between rest and a reached direction along their great
 * circle. A three-angle chart pinches where two angles turn about one axis (a
 * hip flexed 90 degrees, where abduction turns the thigh about itself); the
 * star fills that pinch so the flexed hip may swing aside. Its radius is stored
 * on swingTwistBasis.RAYS great circles leaving rest: the farthest reached
 * swing, raised where its azimuth slope exceeds SLOPE (beside a ray-aligned
 * edge with a jumping farthest reach), then linearly interpolated between rays.
 * Outside directions return along their own great circle to that radius,
 * continuously because the radius is continuous.
 *
 * Twist is clamped to the constraint's swingTwist.twist interval. A
 * circle-to-arc clamp must break somewhere: here at the turn farthest from the
 * interval on either side, which no limb reaches.
 *
 * The construction is this module's; no published method is claimed for it.
 */
export namespace swingTwistRange {
  /**
   * The frame a rig's bone is read in: its clinical axes as the skeleton
   * resolves them (`skeletonJointAxes`, the bone's own declaration over the
   * humanoid table) and the humanoid rest frame; the humanoid table's axes when
   * no skeleton is given.
   *
   * @param bone The bone.
   * @param skeleton The rig; the humanoid tables alone when absent.
   * @returns The frame; none for a bone that has no axes.
   */
  export function of(
    bone: AutoMovieHumanoidBone,
    skeleton?: IAutoMovieSkeleton,
  ): IAutoMovieJointRotationFrame | undefined {
    const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
      skeleton === undefined
        ? HUMANOID_JOINT_AXES
        : skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES);
    return fromAxes(bone, axes[bone]);
  }

  /**
   * Assemble a bone's swing-twist frame from axes already resolved by
   * skeletonJointAxes, retaining its canonical clinical rest frame.
   *
   * @param bone The bone whose clinical rest frame applies.
   * @param axes Its resolved axes; undefined means there is no frame.
   * @returns A fresh frame borrowing the axes and canonical rest frame, or
   *   undefined.
   */
  export function fromAxes(
    bone: AutoMovieHumanoidBone,
    axes: IAutoMovieJointAxes | undefined,
  ): IAutoMovieJointRotationFrame | undefined {
    if (axes === undefined) return undefined;
    const shared: IAutoMovieJointRotationFrame | undefined =
      HUMANOID_RANGES.get(bone);
    return shared !== undefined && shared.axes === axes
      ? shared
      : { axes, frame: HUMANOID_REST_FRAME[bone] };
  }

  /**
   * Prepare one frame for repeated numerical readings while its axes and
   * rest-frame records stay unchanged. Given the constraint, the frame carries
   * its swing region, built once here.
   *
   * @param joint The unchanged frame borrowed by this operation.
   * @param constraint The constraint the frame is read under, when known.
   * @returns The frame, carrying its region when a constraint is given.
   */
  export function prepare(
    joint: IAutoMovieJointRotationFrame,
    constraint?: IAutoMovieJointConstraint,
  ): IAutoMovieJointRotationFrame {
    return constraint === undefined ||
      joint.region?.constraint === constraint
      ? joint
      : { ...joint, region: swingTwistRegion.prepare(constraint, joint) };
  }

  /**
   * A rotation read by swing and twist.
   *
   * @param q The joint's rest-relative rotation.
   * @param joint The joint's axes and rest frame.
   * @returns The reading.
   */
  export function read(
    q: IAutoMovieQuaternion,
    joint: IAutoMovieJointRotationFrame,
  ): IAutoMovieSwingTwistRange.IReading {
    const basis: IAutoMovieSwingTwistBasis.IBasis = swingTwistBasis.of(
      joint.axes,
    );
    const unit: IAutoMovieQuaternion = Quaternion.normalize(q);
    const direction: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(unit, basis.u),
    );
    // The twist alone (`swingTwist.twist`): the swing is read from the
    // direction, so its product is not formed.
    const twisted: IAutoMovieQuaternion =
      swingTwist.twist(unit, basis.u) ?? IDENTITY_TWIST;
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
   */
  export function overshoot(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
  ): number {
    const reading: IAutoMovieSwingTwistRange.IReading = read(q, joint);
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
   * there, and its twist clamped to its interval. A rotation inside is returned
   * unchanged.
   *
   * @param q The joint's rest-relative rotation.
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns The rotation in range.
   */
  export function project(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
  ): IAutoMovieQuaternion {
    const basis: IAutoMovieSwingTwistBasis.IBasis = swingTwistBasis.of(
      joint.axes,
    );
    const reading: IAutoMovieSwingTwistRange.IReading = read(q, joint);
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
   */
  export function chart(
    q: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
  ): IAutoMovieSwingTwistChartPosition {
    const reading: IAutoMovieSwingTwistRange.IReading = read(q, joint);
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
   */
  export function placed(
    place: IAutoMovieSwingTwistChartPosition,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
  ): IAutoMovieQuaternion {
    return placeSwingTwistChart(place, constraint, joint, radius);
  }

  /**
   * A rotation part of the way between two, blended in the range's chart
   * (`chart`): the two places moved straight across the unit disc and the twist
   * straight between the two. The disc and the interval are convex, so two ends
   * inside the range give a blend inside it at every share; the chart is
   * continuous and one to one over the region, so the blend is continuous in
   * its share and in both ends, and meets each end exactly.
   *
   * A spherical interpolation of the two rotations leaves the region where it
   * is not convex: a shoulder carried from a hanging arm to a hand on the nape
   * ran 40 degrees outside it, and its projection onto a radius that rose from
   * 68.5 to 106.7 degrees over 16 degrees of azimuth moved the elbow 200 to 690
   * mm in a frame.
   *
   * @param a The joint's rest-relative rotation at share 0.
   * @param b The same at share 1.
   * @param share How far from `a` to `b`, in [0, 1].
   * @param constraint The constraint, with `swingTwist`.
   * @param joint The joint's axes and rest frame.
   * @returns The rotation: inside the range when both ends are.
   */
  export function blend(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    share: number,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
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
    return blendCharts(from, to, share, constraint, joint);
  }

  /**
   * Prepare the same chart blend for unchanged endpoints, constraint and joint.
   * Construction reads chart(a) then chart(b), at the caller's actual first
   * blend site; every share still runs the original coordinate blend/placed.
   */
  export function prepareBlend(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
  ): (share: number) => IAutoMovieQuaternion {
    const from: IChart = chart(a, constraint, joint);
    const to: IChart = chart(b, constraint, joint);
    const place: (coordinate: IChart) => IAutoMovieQuaternion =
      placeSwingTwistChart.prepare(constraint, joint, radius);
    return (share: number): IAutoMovieQuaternion =>
      blendCharts(from, to, share, constraint, joint, place);
  }

  /**
   * Original chart expressions, shared without a second interpolation
   * algorithm.
   */
  function blendCharts(
    from: IChart,
    to: IChart,
    share: number,
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
    read?: (coordinate: IChart) => IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    const coordinate: IChart = {
      x: from.x + (to.x - from.x) * share,
      y: from.y + (to.y - from.y) * share,
      twist: from.twist + (to.twist - from.twist) * share,
    };
    return read === undefined
      ? placed(coordinate, constraint, joint)
      : read(coordinate);
  }
  /**
   * The swing region's radius on one great circle, degrees, read off the cached
   * table by linear interpolation between its two nearest rays.
   *
   * @param constraint The constraint.
   * @param joint The joint's axes and rest frame.
   * @param azimuth The great circle, degrees about the rest direction from the
   *   flexion axis.
   * @returns The radius, degrees.
   */
  export function radius(
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
    azimuth: number,
  ): number {
    const table: Float64Array = swingTwistRegion.of(constraint, joint).table;
    const rays: number = swingTwistBasis.RAYS;
    const at: number = positiveModulo(azimuth, 360) / (360 / rays);
    const before: number = Math.floor(at) % rays;
    const after: number = (before + 1) % rays;
    const share: number = at - Math.floor(at);
    return table[before]! + (table[after]! - table[before]!) * share;
  }
}
