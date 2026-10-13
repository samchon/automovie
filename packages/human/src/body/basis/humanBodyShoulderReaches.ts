import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderElevationLimit } from "./humanBodyShoulderElevationLimit";

type Shoulder = NonNullable<
  IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]
>;

/**
 * Whether `pose` lies inside the basis's clinical reach for its humerus: the total elevation and axial rotation ranges, then the joint-sinus maximum of its plane, with the overhead pole judged by direction rather than by the plane the author happened to write (see `humanBodyShoulderElevationLimit`).
 *
 * Raw axial interval admission still precedes the overhead envelope branch. Equivalent pole gauges can differ under that raw interval; the plane branch alone is gauge-independent and this reader does not canonicalize clinical axial coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Finite TT angles must satisfy declared elevation and axial intervals plus the periodic plane envelope; an exact overhead elevation uses any envelope plane reaching that same pole direction.
 * @evidence contracts/common.md#clear-and-simple-design Interval refusal precedes the one pole branch or shared envelope interpolation, returning a boolean for admission and editor consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite or out-of-range goals return false without clamping; the basis's admitted clinical source remains authority and a true result supplies no collision or individual capacity measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment names total elevation, raw axial interval, plane envelope and the overhead plane branch's narrower gauge independence.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks precede an O(K) envelope scan or interpolation over K declared knots, using constant temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Builder, rig admission and editor readers share the same elevation-limit owner instead of maintaining different reach formulas; no cache retains pose requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and the declared range remains borrowed; no source buffers, handles or pending work are retained after return.
 */
export function humanBodyShoulderReaches(
  shoulder: Pick<Shoulder, "range">,
  pose: Pick<
    IAutoMovieHumanBodyShoulderPose,
    "plane" | "elevation" | "axialRotation"
  >,
): boolean {
  const range: Shoulder["range"] = shoulder.range;
  if (
    !Number.isFinite(pose.plane) ||
    !Number.isFinite(pose.elevation) ||
    !Number.isFinite(pose.axialRotation) ||
    pose.elevation < range.elevation.min ||
    pose.elevation > range.elevation.max ||
    pose.axialRotation < range.axialRotation.min ||
    pose.axialRotation > range.axialRotation.max
  )
    return false;
  if (pose.elevation === 180)
    return range.envelope.some(([, limit]: [number, number]): boolean => limit >= 180);
  return pose.elevation <= humanBodyShoulderElevationLimit(range, pose.plane);
}
