import { AutoMovieInterpolation } from "./AutoMovieInterpolation";
import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One animation track: a stream of keyframes driving a single channel over time. It mirrors a glTF animation channel and sampler pair, generalized to node TRS, morph weights or a pointer-addressed property.
 *
 * times and values are parallel flat arrays. Outside the keys, sampling copies the endpoint value verbatim; step takes the right key on an exact hit, linear slerps rotations and lerps other values, and cubicspline evaluates Hermite interpolation and normalizes interpolated rotations. Track shape checks do not establish unit authored quaternion values or finite interpolated results. Duplicate canonical channels throw during clip sampling.
 *
 * @evidence contracts/common.md#principled-implementation sampleClip checks track shape before binary segment lookup and glTF interpolation. clipTrackShapeFaults refuses empty/nonfinite arrays, unordered or negative times and malformed fixed-width/cubic strides; its upper-time bound applies only when clip duration is positive, so sampler-supported zero duration does not enforce that bound.
 * @evidence contracts/common.md#clear-and-simple-design Flat parallel arrays keep a track a direct copy of a glTF accessor pair, and the per-keyframe width comes from the channel rather than a stored stride, so one record shape serves every channel kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed track throws its first fault rather than being skipped or padded, and the width of a `weights` channel, which the track cannot know, is reported as unchecked instead of assumed.
 * @evidence contracts/common.md#meaningful-documentation States the clock and units of `times`, the value layout and width rule including the cubic triplet and tangent units, the hold behavior outside the keys, each interpolation's evaluation, and what makes sampling throw.
 * @author Samchon
 */
export interface IAutoMovieTrack {
  /** The channel this track animates; unique among one clip's tracks. */
  channel: IAutoMovieChannel;

  /**
   * Nonempty finite strictly increasing clip-local seconds, at least zero and bounded by a positive clip duration. The low-level zero-duration sampler skips the upper bound and samples at time zero; committed clip artifacts require positive duration.
   */
  times: number[];

  /**
   * Finite flattened values, with length times.length * channelWidth, tripled for cubicspline's in-tangent/value/out-tangent layout and value-units-per-second tangents. A weights channel's model morph-target width is not checked; authored quaternion unit length remains a separate premise.
   */
  values: number[];

  /** How to interpolate between keyframes. */
  interpolation: AutoMovieInterpolation;
}
