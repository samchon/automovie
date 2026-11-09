import { IAutoMovieChannel } from "@automovie/interface";

/**
 * One channel's value sampled at an instant, with the channel it targets.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Pair a borrowed channel address with its sampled numeric vector; sampleClip validates admitted track widths and interpolation while sampleClipSequence chooses authority.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A single pair feeds value drivers, channel limits and shot lighting without a second address representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not establish finite values or channel validity by typing alone; actual sampling/driver owners perform those checks.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify channel ownership and one value per declared component; returned numerical arrays belong to the sample producer's caller.
 */
export interface IAutoMovieSampledChannel {
  /** The channel this value belongs to. */
  channel: IAutoMovieChannel;

  /** The sampled value, one number per channel component. */
  value: number[];
}
