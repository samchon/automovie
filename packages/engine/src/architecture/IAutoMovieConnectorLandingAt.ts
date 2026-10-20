import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One further space a run stops at, placed on the route that reaches it.
 *
 * Produced by `builtConnectorGeometry` in the connector's authored `landings`
 * order. The authored fraction is scaled by the route's total 3D length and
 * the point is interpolated on the polyline segment that length falls in.
 * Validation keeps `at` strictly between `0` and `1` and the space distinct
 * from both ends.
 *
 * @evidence contracts/common.md#principled-implementation Places the landing by arc length: the authored fraction is scaled by the route's total 3D length and linearly interpolated on the segment that length falls in, so an unevenly spaced route keeps the stop where its author put it.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, the served space, the authored fraction and the resolved world point, which is the join a shot needs between a stop and its place on the run.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation keeps the fraction strictly inside `(0, 1)`, the space resolvable, distinct from both ends and unique per run, so the producer needs no clamp or fallback for a landing at an end.
 * @evidence contracts/common.md#meaningful-documentation States the producer and order, how the fraction becomes a point, the validation guarantees on the fraction and the space, and that `position` is in world space.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; locating each landing walks the cumulative length table once, answered on `builtConnectorGeometry`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per geometry call; the cumulative length table is shared with that call's stations and is not retained afterwards.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds a string, a number and a fresh vector, owned by the geometry's `landings` array.
 */
export interface IAutoMovieConnectorLandingAt {
  /** Logical space served at this stop. */
  space: string;

  /** Arc-length fraction of the route, as authored. */
  at: number;

  /** World position of that point of the route. */
  position: IAutoMovieVector3;
}
