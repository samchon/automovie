import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One run joining exactly two ports: a pipe, a duct, a conduit, a cable tray.
 *
 * The centre line is authored in world metres because that is what a clash is
 * measured in, and the radius is what turns that line into the volume the run
 * actually occupies. A run that leaves the space it started in is expected to
 * name the sleeve it went through, which is the only way a wall can be shown to
 * have been drilled on purpose.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `IAutoMovieServiceSegment` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `IAutoMovieServiceSegment` for the interior space service network contract system contract.
 */
export interface IAutoMovieServiceSegment {
  /**
   * Stable segment identity within the network.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `id` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `id` for the interior space service network contract system contract.
   */
  id: string;

  /**
   * Id of the system this run belongs to.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `system` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `system` for the interior space service network contract system contract.
   */
  system: string;

  /**
   * Id of the port the medium leaves from; it must be `out` or `bidirectional`.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `from` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `from` for the interior space service network contract system contract.
   */
  from: string;

  /**
   * Id of the port the medium arrives at; it must be `in` or `bidirectional`.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `to` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `to` for the interior space service network contract system contract.
   */
  to: string;

  /**
   * World centre line in metres, including both endpoints. The first point must
   * coincide with the `from` port and the last with the `to` port.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `route` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `route` for the interior space service network contract system contract.
   */
  route: IAutoMovieVector3[];

  /**
   * Outer radius in metres used for clash and clearance; greater than `0`.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `radius` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `radius` for the interior space service network contract system contract.
   */
  radius: number;

  /**
   * Internal cross-section in square metres; greater than `0`.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `section` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `section` for the interior space service network contract system contract.
   */
  section: number;

  /**
   * Ids of the penetrations this run passes through, in no particular order.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `penetrations` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `penetrations` for the interior space service network contract system contract.
   */
  penetrations: string[];
}
