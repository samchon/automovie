import { IAutoMovieConnectorLandingAt } from "./IAutoMovieConnectorLandingAt";
import { IAutoMovieConnectorStation } from "./IAutoMovieConnectorStation";

/**
 * The measured traversal shape of one connector.
 *
 * Produced by `builtConnectorGeometry`, which throws when the route has fewer
 * than two points or no length. World `+Y` is up: `rise` is the net change in
 * `y` between the end stations, `run` sums each segment's XZ length, and
 * `slope` is `atan2(|rise|, run)`, an average over the whole route rather than
 * its steepest segment. A route that climbs and then descends reports only its
 * net rise.
 *
 * @author Samchon
 */
export interface IAutoMovieConnectorGeometry {
  /** Signed net climb from the first station to the last, in metres. */
  rise: number;

  /** Horizontal length of the route polyline, in metres. */
  run: number;

  /** Total 3D length of the route polyline, in metres. */
  length: number;

  /** Route-average slope from horizontal, in radians within `[0, PI / 2]`. */
  slope: number;

  /** The route's own stations, in authored order. */
  stations: IAutoMovieConnectorStation[];

  /** The further spaces the run stops at, placed on its own route. */
  landings: IAutoMovieConnectorLandingAt[];
}
