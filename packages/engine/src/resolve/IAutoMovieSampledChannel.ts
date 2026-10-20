import { IAutoMovieChannel } from "@automovie/interface";

/**
 * One channel's value sampled at an instant, with the channel it targets.
 *
 *
 * @evidence contracts/common.md#principled-implementation Pair a borrowed channel address with its sampled numeric vector; sampleClip validates admitted track widths and interpolation while sampleClipSequence chooses authority.
 * @evidence contracts/common.md#clear-and-simple-design A single pair feeds value drivers, channel limits and shot lighting without a second address representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not establish finite values or channel validity by typing alone; actual sampling/driver owners perform those checks.
 * @evidence contracts/common.md#meaningful-documentation Members identify channel ownership and one value per declared component; returned numerical arrays belong to the sample producer's caller.
 * @evidence contracts/performance.md#efficient-algorithms Storage grows with vector width W and address text; interpolation/track-validation costs remain with the sampler.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolution consumes the completed sample vector; repeated use does not imply another interpolation, while changed clip contents/time require resampling.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The consumer owns the value array for the frame and borrows channel metadata; no keyframe history, host animation object or task is acquired.
 */
export interface IAutoMovieSampledChannel {
  /** The channel this value belongs to. */
  channel: IAutoMovieChannel;

  /** The sampled value, one number per channel component. */
  value: number[];
}
