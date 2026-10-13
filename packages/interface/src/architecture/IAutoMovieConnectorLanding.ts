/**
 * One further space a run serves at a point along its own route.
 *
 * Where the stop is on the route is stated; whether that point falls inside the
 * space it serves is not checked, because a run may legitimately serve a space
 * it only reaches the edge of — a facade ladder leaves a storey from outside
 * the storey's own volume. Where a **carriage** stands is checked, because a
 * carriage is a body with a place rather than a station on a centreline.
 *
 * @evidence contracts/common.md#principled-implementation A landing is an arc-length fraction of the 3D route polyline, which `builtConnectorGeometry` maps to a point through cumulative segment lengths, so its position does not depend on how many route points precede it.
 * @evidence contracts/common.md#clear-and-simple-design Only a space id and a fraction are stored and the world position is derived from the route on demand, so moving a route point never leaves a stored landing position behind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whether the landing point lies inside its space is deliberately unchecked for stations, while carriage service is checked against geometry; that split is the stated basis, not a missing test.
 * @evidence contracts/common.md#meaningful-documentation States the fraction's measure and open interval, the endpoint exclusion and uniqueness rules, ordering, and what containment is and is not checked.
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
