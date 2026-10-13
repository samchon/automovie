/**
 * One further space a run serves at a point along its own route.
 *
 * Where the stop is on the route is stated; whether that point falls inside the
 * space it serves is not checked, because a run may legitimately serve a space
 * it only reaches the edge of — a facade ladder leaves a storey from outside
 * the storey's own volume. Where a **carriage** stands is checked, because a
 * carriage is a body with a place rather than a station on a centreline.
 */
export interface IAutoMovieConnectorLanding {
  /** Logical space served here; neither of the run's own endpoints. */
  space: string;

  /**
   * Arc-length fraction of the 3D route polyline where the run serves it,
   * strictly between `0` (the {@link IAutoMovieBuiltConnector.from} end) and `1`
   * (the {@link IAutoMovieBuiltConnector.to} end).
   */
  at: number;
}
