import { IAutoMovieConnectorLandingAt } from "./IAutoMovieConnectorLandingAt";
import { IAutoMovieConnectorStation } from "./IAutoMovieConnectorStation";

/** The measured traversal shape of one connector. */
export interface IAutoMovieConnectorGeometry {
  /** Signed climb from the first station to the last, in metres. */
  rise: number;
  /** Horizontal length of the route polyline, in metres. */
  run: number;
  /** Total 3D length of the route polyline, in metres. */
  length: number;
  /** Slope of the run from horizontal, in radians within `[0, PI / 2]`. */
  slope: number;
  /** The route's own stations, in authored order. */
  stations: IAutoMovieConnectorStation[];
  /** The further spaces the run stops at, placed on its own route. */
  landings: IAutoMovieConnectorLandingAt[];
}
