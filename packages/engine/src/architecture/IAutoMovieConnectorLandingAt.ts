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
 * @evidence contracts/common.md#principled-implementation Arc-length interpolation on the route polyline, so a landing on an unevenly spaced route sits where its author put it rather than at a point index.
 * @evidence contracts/common.md#clear-and-simple-design Pairs the served space with both the authored fraction and the derived world point, so a stager needs neither the route nor the fraction rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No landing is snapped to a route point; a fraction outside `(0, 1)` is refused by validation, so the producer never extrapolates for a validated record.
 * @evidence contracts/common.md#meaningful-documentation States the producer and ordering, how the position is derived from the fraction, and the validated range of `at`.
 * @evidenceExclude contracts/performance.md#cost-and-resources A fresh interpolated position and a space id; locating it is a linear scan over route segments, repeated on every geometry query.
 * @author Samchon
 */
export interface IAutoMovieConnectorLandingAt {
  /** Logical space served at this stop. */
  space: string;

  /** Arc-length fraction of the route, as authored. */
  at: number;

  /** World position of that point of the route. */
  position: IAutoMovieVector3;
}
