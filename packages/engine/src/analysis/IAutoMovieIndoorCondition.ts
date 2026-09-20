/**
 * The indoor air an envelope is analysed against.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieIndoorCondition` declares the room temperature and moisture state against which envelope performance is judged.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The condition supplies the indoor side of heat-flow, dew-point, and surface-condensation calculations.
 */
export interface IAutoMovieIndoorCondition {
  /**
   * Dry-bulb air temperature in degrees Celsius.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `airTemperature` states the authored indoor dry-bulb condition rather than inferring comfort from geometry.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The Celsius input forms the warm boundary for fabric loss, surface temperature, and Magnus dew-point evaluation.
   */
  airTemperature: number;
  /**
   * Relative humidity as a `[0, 1]` fraction.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `relativeHumidity` declares the indoor moisture fraction used to test condensation risk.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The bounded fraction combines with air temperature in the Magnus equation to produce the comparison dew point.
   */
  relativeHumidity: number;
}
