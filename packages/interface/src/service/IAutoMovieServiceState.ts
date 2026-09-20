/**
 * Named operating state of a valve, a damper, a switch or a similar device.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `IAutoMovieServiceState` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `IAutoMovieServiceState` for the interior space service network contract system contract.
 */
export interface IAutoMovieServiceState {
  /**
   * Author-named state such as `open`, `closed`, or `throttled`.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `name` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `name` for the interior space service network contract system contract.
   */
  name: string;

  /**
   * Fraction of nominal capacity the state passes, within the closed range `[0,
   * 1]`. Exactly `0` isolates everything downstream of the device.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `opening` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `opening` for the interior space service network contract system contract.
   */
  opening: number;
}
