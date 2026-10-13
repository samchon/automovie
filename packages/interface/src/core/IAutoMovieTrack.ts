import { AutoMovieInterpolation } from "./AutoMovieInterpolation";
import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One animation track: a stream of keyframes driving a single channel over
 * time. Mirrors a glTF animation channel+sampler pair, generalized so the
 * target is any {@link IAutoMovieChannel} (node TRS, morph weights, or a
 * pointer-addressed property like a camera FOV or material factor).
 *
 * `times` and `values` are parallel flat arrays (glTF accessor style): `times`
 * is keyframe timestamps in seconds; `values` is the keyframe values flattened,
 * its width per keyframe set by the channel's value type (and ×3 for
 * `cubicspline`, which stores in-tangent/value/out-tangent triplets).
 *
 * Before the first key and after the last the track holds that key's value.
 * `step` holds the left key and takes the right key on an exact hit, `linear`
 * slerps rotation channels and lerps the rest, and `cubicspline` evaluates the
 * Hermite spline and renormalizes rotations. A malformed track throws its first
 * fault when sampled.
 *
 * @author Samchon
 */
export interface IAutoMovieTrack {
  /** The channel this track animates. */
  channel: IAutoMovieChannel;

  /**
   * Keyframe timestamps in seconds on the clip's clock. Strictly increasing,
   * finite, `>= 0` and `<= duration`; the engine's temporal validator enforces
   * this (not the rough type).
   */
  times: number[];

  /**
   * Keyframe values, flattened, every one finite. Length is `times.length ×
   * channelWidth` (× 3 for `cubicspline`). The channel's value type sets
   * `channelWidth`; a `weights` channel's width is the model's morph count,
   * which is not checked.
   */
  values: number[];

  /** How to interpolate between keyframes. */
  interpolation: AutoMovieInterpolation;
}
