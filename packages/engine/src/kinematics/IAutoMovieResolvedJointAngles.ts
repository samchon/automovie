/**
 * Three fully resolved angular coordinates of one joint, in degrees.
 *
 * All values are numbers: unlike an authored joint pose, none is an omitted
 * axis and this result carries no bone identity. `decomposeJointRotation`
 * obtains rest-relative coordinates from a quaternion and lifts them through
 * the caller's optional clinical rest frame, so the conversion owner decides
 * which frame the numbers use. The record does not claim the angles are within
 * any physiological range.
 *
 * @evidence contracts/common.md#principled-implementation The three coordinates of the axis-angle composition `jointToQuaternion` builds, recovered in closed form, so passing them back with the same axes and frame reconstructs the quaternion.
 * @evidence contracts/common.md#clear-and-simple-design Separate from the authored pose type because every field is required here; callers add the bone themselves when they build a pose joint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are never clamped to a range; a chart may be chosen by the caller's domain, but the coordinates still describe the input rotation exactly.
 * @evidence contracts/common.md#meaningful-documentation States the unit, why every field is required, the producer and frame ownership, and that no range is implied.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Three angles produced by a constant-time closed-form extraction answered on `decomposeJointRotation`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per decomposition; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three numbers, released with the caller's pose.
 * @author Samchon
 */
export interface IAutoMovieResolvedJointAngles {
  /** Flexion or extension coordinate, degrees in the conversion owner's frame. */
  flexion: number;

  /** Abduction or adduction coordinate, degrees in the same frame. */
  abduction: number;

  /** Axial twist coordinate, degrees in the same frame. */
  twist: number;
}
