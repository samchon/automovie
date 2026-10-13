import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One oriented station of a connector's route.
 *
 * Produced by `builtConnectorGeometry`, one per authored route point in route
 * order. `at` is the cumulative 3D length to this point over the route's
 * total, so the first station is `0` and the last `1`. `position` and
 * `rotation` are the connector record's own objects, not copies.
 *
 * @author Samchon
 */
export interface IAutoMovieConnectorStation {
  /** World position of the station, the authored route point itself. */
  position: IAutoMovieVector3;

  /** Authored facing, or null when the connector declared none. */
  rotation: IAutoMovieQuaternion | null;

  /** Arc-length fraction of the station along the route, in `[0, 1]`. */
  at: number;
}
