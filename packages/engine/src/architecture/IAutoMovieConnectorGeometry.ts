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
 * @evidence contracts/common.md#principled-implementation Polyline measures: net world-`Y` rise between end stations, summed horizontal segment lengths, summed 3D segment lengths, and their arctangent ratio as a route-average slope.
 * @evidence contracts/common.md#clear-and-simple-design Bundles the stations and landings with the scalar measures so a shot or analysis reads one connector's traversal from a single call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No connector kind such as stair, ramp or lift changes the measures; a route that climbs and descends reports its net rise only, which this record does not flag.
 * @evidence contracts/common.md#meaningful-documentation States the producer's refusal, the up axis that `rise` and `run` are read on, that slope is a route average, and the units.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record; its producer walks the route twice, computing every segment's 3D length in both passes, and scans segments linearly per landing with no per-connector cache, while stations reuse the authored route and orientation objects.
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
