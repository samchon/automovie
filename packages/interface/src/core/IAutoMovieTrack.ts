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
 * @evidence contracts/common.md#principled-implementation glTF sampler semantics: a binary search finds the straddling segment, `step` follows the glTF half-open interval rule, `linear` uses slerp for quaternions, and `cubicspline` scales stored tangents by the segment span before evaluating the Hermite basis.
 * @evidence contracts/common.md#clear-and-simple-design Parallel flat arrays keep the glTF accessor layout so imports and exports need no reshaping, and the per-key stride is derived from the channel instead of being stored on the track.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Taking the right key on an exact `step` hit is the glTF definition applied at the fixed sampling clock (#1054), not a timing fudge, and malformed shapes throw rather than being repaired.
 * @evidence contracts/common.md#meaningful-documentation States the time unit and ordering rules, the flattening and stride including cubic triplets, the unchecked weights width, the hold outside the keyed range, and each interpolation rule.
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
