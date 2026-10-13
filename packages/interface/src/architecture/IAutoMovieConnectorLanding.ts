/**
 * One further space a run serves at a point along its own route.
 *
 * Where the stop is on the route is stated; whether that point falls inside the
 * space it serves is not checked, because a run may serve a space it only
 * reaches the edge of, as a facade ladder leaves a storey from outside the
 * storey's own volume. Where a carriage stands is checked instead, through
 * {@link IAutoMovieCarriageValue.serves}, because a carriage is a body with a
 * place rather than a station on a centreline.
 *
 * @evidence contracts/common.md#principled-implementation A stop is a space id plus an arc-length fraction of the 3D route polyline, so its position is the route point at that share of total length, independent of how unevenly the route points are spaced.
 * @evidence contracts/common.md#clear-and-simple-design Endpoints stay on the connector's `from` and `to`, and a landing names only an intermediate space, so the stop list of a run is `from`, the landings in order, then `to`, with nothing stated twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Containment of the stop point is deliberately not tested, for the stated facade-ladder reason, and the check moves to the carriage that physically stands there rather than being skipped.
 * @evidence contracts/common.md#meaningful-documentation States why the stop point is not tested for containment and what is tested instead, that the space resolves, appears once, and is not an endpoint, and the open range and strict ordering of `at`.
 * @author Samchon
 */
export interface IAutoMovieConnectorLanding {
  /**
   * Logical space served here; it resolves, appears once among the run's
   * landings, and is neither of the run's own endpoints.
   */
  space: string;

  /**
   * Arc-length fraction of the 3D route polyline where the run serves it,
   * strictly between `0` (the {@link IAutoMovieBuiltConnector.from} end) and `1`
   * (the {@link IAutoMovieBuiltConnector.to} end), and strictly greater than
   * the previous landing's fraction.
   */
  at: number;
}
