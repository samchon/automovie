import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieServiceMedium } from "./AutoMovieServiceMedium";
import { AutoMovieServicePortDirection } from "./AutoMovieServicePortDirection";
import { AutoMovieServiceUnit } from "./AutoMovieServiceUnit";

/**
 * One typed connection point on a node.
 *
 * Direction is stated **relative to the node**: `in` means the medium arrives
 * from the network, `out` means the node puts it into the network. A tap has an
 * `in` cold water port and a floor gully has an `out` waste port, so the same
 * word means the same thing whether the medium is water, air, power or signal,
 * and a segment always runs from an `out` port to an `in` one.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `IAutoMovieServicePort` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `IAutoMovieServicePort` for the interior space service network contract system contract.
 */
export interface IAutoMovieServicePort {
  /**
   * Stable port identity, unique across the whole network.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `id` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `id` for the interior space service network contract system contract.
   */
  id: string;

  /**
   * Id of the system this port belongs to.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `system` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `system` for the interior space service network contract system contract.
   */
  system: string;

  /**
   * What the port carries. It must equal its system's medium.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `medium` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `medium` for the interior space service network contract system contract.
   */
  medium: AutoMovieServiceMedium;

  /**
   * Which way the port faces, relative to the node that owns it.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `direction` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `direction` for the interior space service network contract system contract.
   */
  direction: AutoMovieServicePortDirection;

  /**
   * Unit {@link demand} is stated in. It must equal its system's unit.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `unit` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `unit` for the interior space service network contract system contract.
   */
  unit: AutoMovieServiceUnit;

  /**
   * Design flow, load or bandwidth through this port in {@link unit}; a finite
   * number `>= 0`. A fitting that merely passes the medium on — a tee, a valve,
   * a damper, a switch — declares `0`, because the demand beyond it is already
   * stated where it is actually drawn.
   *
   * It is the port's own terminal that states it: a basin states what it draws
   * on its `in` supply port and what it discharges on its `out` waste port, so
   * a supply system and a drainage system are each loaded by the end that
   * actually loads them.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `demand` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `demand` for the interior space service network contract system contract.
   */
  demand: number;

  /**
   * Internal cross-section in square metres a joining segment must match; a
   * finite number greater than `0`, or `null` when the port imposes none.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `section` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `section` for the interior space service network contract system contract.
   */
  section: number | null;

  /**
   * World position of the connection point, in metres.
   *
   * It stands inside the same logical space its node stands in. A run is
   * anchored to this point at both ends, and a wall crossing is read between
   * consecutive route points, so a port allowed to sit in another room would
   * let a run terminate where its fitting is not and never appear to cross
   * anything.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `position` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `position` for the interior space service network contract system contract.
   */
  position: IAutoMovieVector3;
}
