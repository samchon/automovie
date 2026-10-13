import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** One oriented station of a connector's route. */
export interface IAutoMovieConnectorStation {
  /** World position of the station. */
  position: IAutoMovieVector3;
  /** Authored facing, or null when the connector declared none. */
  rotation: IAutoMovieQuaternion | null;
  /** Arc-length fraction of the station along the route, in `[0, 1]`. */
  at: number;
}
