import { IAutoMovieChannel } from "@automovie/interface";

/**
 * One channel's value sampled at an instant, with the channel it targets.
 *
 * @author Samchon
 */
export interface IAutoMovieSampledChannel {
  /** The channel this value belongs to. */
  channel: IAutoMovieChannel;

  /** The sampled value, one number per channel component. */
  value: number[];
}
