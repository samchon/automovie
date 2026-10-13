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
 * @author Samchon
 */
export interface IAutoMovieTrack {
  /** The channel this track animates. */
  channel: IAutoMovieChannel;

  /**
   * Keyframe timestamps in seconds. Strictly increasing, first `>= 0`; the
   * engine's temporal validator enforces this (not the rough type).
   */
  times: number[];

  /**
   * Keyframe values, flattened. Length is `times.length × channelWidth` (× 3
   * for `cubicspline`). The channel's value type sets `channelWidth`.
   */
  values: number[];

  /** How to interpolate between keyframes. */
  interpolation: AutoMovieInterpolation;
}
