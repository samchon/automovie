import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One oriented station of a connector's route.
 *
 * Produced by `builtConnectorGeometry`, one per authored route point in route
 * order. `at` is the cumulative 3D length to this point over the route's
 * total, so the first station is `0` and the last `1`. `position` and
 * `rotation` are the connector record's own objects, not copies.
 *
 * @evidence contracts/development/design.md#principled-representation One record per authored route point whose `at` is the cumulative 3D length to that point over the total, so stations share the arc-length parameter landings and sections use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Position, optional facing and fraction are what a traversal reads per point; a facing the author did not state stays null instead of a derived heading.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No heading is invented for a connector without orientations, which keeps a later analysis from treating a guess as a design decision.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and order, how `at` is computed with its end values, that `position` and `rotation` alias the record's objects, and what a null rotation means.
 */
export interface IAutoMovieConnectorStation {
  /** World position of the station, the authored route point itself. */
  position: IAutoMovieVector3;

  /** Authored facing, or null when the connector declared none. */
  rotation: IAutoMovieQuaternion | null;

  /** Arc-length fraction of the station along the route, in `[0, 1]`. */
  at: number;
}
