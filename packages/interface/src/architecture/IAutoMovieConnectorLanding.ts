/**
 * One further space a run serves at a point along its own route.
 *
 * Where the stop is on the route is stated; whether that point falls inside the
 * space it serves is not checked, because a run may legitimately serve a space
 * it only reaches the edge of — a facade ladder leaves a storey from outside
 * the storey's own volume. Where a **carriage** stands is checked, because a
 * carriage is a body with a place rather than a station on a centreline.
 *
 * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `IAutoMovieConnectorLanding` as the portable data boundary for the interior route refusal requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `IAutoMovieConnectorLanding` for the interior space connector route topology system contract.
 */
export interface IAutoMovieConnectorLanding {
  /**
   * Logical space served here; neither of the run's own endpoints.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `space` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `space` for the interior space connector route topology system contract.
   */
  space: string;
  /**
   * Arc-length fraction of the 3D route polyline where the run serves it,
   * strictly between `0` (the {@link IAutoMovieBuiltConnector.from} end) and `1`
   * (the {@link IAutoMovieBuiltConnector.to} end).
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `at` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `at` for the interior space connector route topology system contract.
   */
  at: number;
}
