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
 * @evidence contracts/common.md#principled-implementation Records binary64 polyline measurements: summed horizontal/3D segment lengths, endpoint net rise and `atan2(|rise|, run)`. These are computed route metrics, not exact-real values; finite source coordinates alone do not guarantee finite derived arithmetic, which callers must account for.
 * @evidence contracts/common.md#clear-and-simple-design Groups the scalar figures with the stations and landings placed on the same arc length, so a caller reads the whole traversal shape from one call instead of re-walking the route.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The route-average slope and net rise are stated as such rather than replaced by a steepest-segment figure for some consumer, and a degenerate route throws instead of reporting zero lengths.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its refusals, the up axis, how rise, run and slope are computed and that slope is a route average, the net-rise limitation of a climb that descends, and the metre and radian units with the slope's range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; its figures cost two linear passes over the route points plus one segment walk per landing, answered on `builtConnectorGeometry`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computed per call from the connector record; no geometry is stored, so an edited route never reads a stale measurement.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Station `position` and `rotation` alias the connector record's own objects; the record and the landing positions are otherwise fresh and owned by the caller.
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
