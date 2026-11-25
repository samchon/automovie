import type { AutoMovieInterpolation } from "./AutoMovieInterpolation";
import type { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One animation track: a stream of keyframes driving a single channel over
 * time. It mirrors a glTF animation channel and sampler pair, generalized to
 * node TRS, morph weights or a pointer-addressed property.
 *
 * Times and values are parallel flat arrays. Outside the keys, sampling copies
 * the endpoint value verbatim; step takes the right key on an exact hit, linear
 * slerps rotations and lerps other values, and cubicspline evaluates Hermite
 * interpolation and normalizes interpolated rotations. Track shape checks do
 * not establish unit authored quaternion values or finite interpolated results.
 * Duplicate canonical channels throw during clip sampling.
 */
export interface IAutoMovieTrack {
  /** The channel this track animates; unique among one clip's tracks. */
  channel: IAutoMovieChannel;

  /**
   * Nonempty finite strictly increasing clip-local seconds, at least zero and
   * bounded by a positive clip duration. The low-level zero-duration sampler
   * skips the upper bound and samples at time zero; committed clip artifacts
   * require positive duration.
   */
  times: number[];

  /**
   * Finite flattened values, with length times.length * channelWidth, tripled
   * for cubicspline's in-tangent/value/out-tangent layout and
   * value-units-per-second tangents. A weights channel's model morph-target
   * width is not checked; authored quaternion unit length remains a separate
   * premise.
   */
  values: number[];

  /** How to interpolate between keyframes. */
  interpolation: AutoMovieInterpolation;
}
