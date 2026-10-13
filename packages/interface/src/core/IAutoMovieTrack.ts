import { AutoMovieInterpolation } from "./AutoMovieInterpolation";
import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One animation track: a stream of keyframes driving a single channel over
 * time. It mirrors a glTF animation channel and sampler pair, generalized so
 * the target is any {@link IAutoMovieChannel}: a node TRS component, morph
 * weights, or a pointer-addressed property.
 *
 * `times` and `values` are parallel flat arrays in glTF accessor style. Before
 * the first key and after the last the track holds that key's value. `step`
 * holds the left key and takes the right key on an exact hit, `linear` slerps
 * rotation channels and lerps the rest, and `cubicspline` evaluates the
 * Hermite spline and renormalizes rotations. Two tracks of one clip on the
 * same channel, or a malformed track, throw when the clip is sampled; the
 * sampler reports the first fault `clipTrackShapeFaults` finds.
 *
 * @evidence contracts/common.md#principled-implementation `sampleClip` locates the straddling segment by binary search over strictly increasing times and evaluates the glTF sampler for the interpolation; its premise is a well-formed track, which `clipTrackShapeFaults` checks first by refusing empty, non-finite, out-of-order or out-of-clip times and a value count that is not keyframes times the channel width, tripled for cubic.
 * @evidence contracts/common.md#clear-and-simple-design Flat parallel arrays keep a track a direct copy of a glTF accessor pair, and the per-keyframe width comes from the channel rather than a stored stride, so one record shape serves every channel kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed track throws its first fault rather than being skipped or padded, and the width of a `weights` channel, which the track cannot know, is reported as unchecked instead of assumed.
 * @evidence contracts/common.md#meaningful-documentation States the clock and units of `times`, the value layout and width rule including the cubic triplet and tangent units, the hold behavior outside the keys, each interpolation's evaluation, and what makes sampling throw.
 * @author Samchon
 */
export interface IAutoMovieTrack {
  /** The channel this track animates; unique among one clip's tracks. */
  channel: IAutoMovieChannel;

  /**
   * Keyframe timestamps in seconds on the clip's clock: non-empty, finite,
   * strictly increasing, at least `0` and at most the clip's `duration`.
   */
  times: number[];

  /**
   * Keyframe values, flattened, every one finite. Its length is `times.length ×
   * channelWidth`, tripled for `cubicspline`, whose keyframes store
   * in-tangent, value and out-tangent with tangents in value units per second.
   * The channel sets `channelWidth`; a `weights` channel's width is the
   * model's morph target count, which is not checked.
   */
  values: number[];

  /** How to interpolate between keyframes. */
  interpolation: AutoMovieInterpolation;
}
