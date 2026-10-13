import { IAutoMovieChannelLimit, IAutoMovieDriver } from "@automovie/interface";

/**
 * A profile's declared limits/drivers, resolved onto concrete node ids.
 *
 * @author Samchon
 */
export interface IAutoMovieBoundProfile {
  /** The profile's limits with every node reference made concrete. */
  limits: IAutoMovieChannelLimit[];

  /** The profile's drivers with every node reference made concrete. */
  drivers: IAutoMovieDriver[];
}
