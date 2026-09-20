import { IAutoMovieChannel } from "@automovie/interface";

/**
 * One channel's value sampled at an instant, with the channel it targets.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Carries the typed interpolation result together with its addressed channel.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Defines the per-channel output of clip sampling.
 * @author Samchon
 */
export interface IAutoMovieSampledChannel {
  /**
   * The channel this value belongs to.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Preserves which typed channel selected the interpolation rule for this value.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Keeps each sampled result attached to its source track channel.
   */
  channel: IAutoMovieChannel;

  /**
   * The sampled value, one number per channel component.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Carries the value produced by the channel-appropriate interpolation rule.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Emits the dense channel value resolved from sparse clip keys.
   */
  value: number[];
}
