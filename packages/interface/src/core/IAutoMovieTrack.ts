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
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Exposes `IAutoMovieTrack` as the portable data boundary for the motion sparse channel default requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieTrack` for the performance motion clip keytime interpolation system contract.
 * @author Samchon
 */
export interface IAutoMovieTrack {
  /**
   * The channel this track animates.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Exposes `channel` as the portable data boundary for the motion sparse channel default requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `channel` for the performance motion clip keytime interpolation system contract.
   */
  channel: IAutoMovieChannel;

  /**
   * Keyframe timestamps in seconds. Strictly increasing, first `>= 0`; the
   * engine's temporal validator enforces this (not the rough type).
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Exposes `times` as the portable data boundary for the motion sparse channel default requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `times` for the performance motion clip keytime interpolation system contract.
   */
  times: number[];

  /**
   * Keyframe values, flattened. Length is `times.length × channelWidth` (× 3
   * for `cubicspline`). The channel's value type sets `channelWidth`.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Exposes `values` as the portable data boundary for the motion sparse channel default requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `values` for the performance motion clip keytime interpolation system contract.
   */
  values: number[];

  /**
   * How to interpolate between keyframes.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Exposes `interpolation` as the portable data boundary for the motion sparse channel default requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `interpolation` for the performance motion clip keytime interpolation system contract.
   */
  interpolation: AutoMovieInterpolation;
}
