/**
 * The repeated step of a stepped connector.
 *
 * The three numbers are checked against the route they describe: the flight's
 * risers must add up to the route's own climb and its goings to the route's own
 * horizontal run, within a millimetre. A stair whose steps do not reach its own
 * landing is a design defect, not a rendering detail.
 *
 * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `IAutoMovieConnectorSteps` as the portable data boundary for the interior route refusal requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `IAutoMovieConnectorSteps` for the interior space connector route topology system contract.
 */
export interface IAutoMovieConnectorSteps {
  /**
   * How many steps the run has; a safe integer of at least `1`.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `count` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `count` for the interior space connector route topology system contract.
   */
  count: number;
  /**
   * Positive vertical rise of one step, in metres.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `rise` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `rise` for the interior space connector route topology system contract.
   */
  rise: number;
  /**
   * Positive horizontal going of one step, in metres.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal Exposes `run` as the portable data boundary for the interior route refusal requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `run` for the interior space connector route topology system contract.
   */
  run: number;
}
