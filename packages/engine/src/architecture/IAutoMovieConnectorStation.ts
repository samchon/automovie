import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One oriented station of a connector's route.
 *
 * Produced by `builtConnectorGeometry`, one per authored route point in route
 * order. `at` is the cumulative 3D length to this point over the route's
 * total, so the first station is `0` and the last `1`. `position` and
 * `rotation` are the connector record's own objects, not copies.
 *
 * @evidence contracts/common.md#principled-implementation One record per authored route point whose `at` is the cumulative 3D length to that point over the total, so stations share the arc-length parameter landings and sections use.
 * @evidence contracts/common.md#clear-and-simple-design Position, optional facing and fraction are what a traversal reads per point; a facing the author did not state stays null instead of a derived heading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No heading is invented for a connector without orientations, which keeps a later analysis from treating a guess as a design decision.
 * @evidence contracts/common.md#meaningful-documentation States the producer and order, how `at` is computed with its end values, that `position` and `rotation` alias the record's objects, and what a null rotation means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; stations come from one cumulative-length pass over the route, answered on `builtConnectorGeometry`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per geometry call and not memoized, since the route is read from the live record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References the connector record's own point and quaternion objects rather than copies, so the environment record keeps them alive and a mutation through a station edits the record.
 */
export interface IAutoMovieConnectorStation {
  /** World position of the station, the authored route point itself. */
  position: IAutoMovieVector3;

  /** Authored facing, or null when the connector declared none. */
  rotation: IAutoMovieQuaternion | null;

  /** Arc-length fraction of the station along the route, in `[0, 1]`. */
  at: number;
}
