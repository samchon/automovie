import type { IAutoMovieChannelLimit } from "../core/IAutoMovieChannelLimit";
import type { IAutoMovieDriver } from "../core/IAutoMovieDriver";

/** A profile's declared limits/drivers, resolved onto concrete node ids. */
export interface IAutoMovieBoundProfile {
  /** The profile's limits with every node reference made concrete. */
  limits: IAutoMovieChannelLimit[];

  /** The profile's drivers with every node reference made concrete. */
  drivers: IAutoMovieDriver[];
}
