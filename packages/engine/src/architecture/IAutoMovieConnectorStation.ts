import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One oriented station of a connector's route.
 *
 * Produced by `builtConnectorGeometry`, one per authored route point in route
 * order. `at` is the cumulative 3D length to this point over the route's
 * total, so the first station is `0` and the last `1`. `position` and
 * `rotation` are the connector record's own objects, not copies.
 *
 * @evidence contracts/common.md#principled-implementation Arc-length parametrization of the authored polyline, so uneven spacing between route points does not distort a station's fraction.
 * @evidence contracts/common.md#clear-and-simple-design Pairs each route point with its optional authored facing and its fraction, the three facts a stager needs per point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `rotation` is `null` when the connector declared no orientations, never a heading derived from the route direction.
 * @evidence contracts/common.md#meaningful-documentation States the producer, ordering, the fraction's definition and end values, the aliasing of position and rotation, and what a `null` rotation means.
 * @evidenceExclude contracts/performance.md#cost-and-resources Computed by one cumulative-length pass and rebuilt per geometry query; its position and rotation are the authored objects themselves, so it allocates nothing for them.
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
