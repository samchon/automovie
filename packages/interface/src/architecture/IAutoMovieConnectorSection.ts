/**
 * The usable section of a connector at one point along its route.
 *
 * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `IAutoMovieConnectorSection` as the portable data boundary for the interior route refusal requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `IAutoMovieConnectorSection` for the interior space connector route topology system contract.
 */
export interface IAutoMovieConnectorSection {
  /**
   * Arc-length fraction of the 3D route polyline, `0` at the first point and
   * `1` at the last. Measuring along the route rather than by point index is
   * what keeps a station on an unevenly spaced route where it was put.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `at` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `at` for the interior space connector route topology system contract.
   */
  at: number;
  /**
   * Positive usable width in metres here.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `width` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `width` for the interior space connector route topology system contract.
   */
  width: number;
  /**
   * Positive vertical clearance in metres here.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `clearHeight` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `clearHeight` for the interior space connector route topology system contract.
   */
  clearHeight: number;
}
