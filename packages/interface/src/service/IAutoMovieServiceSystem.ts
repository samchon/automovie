import { AutoMovieServiceDiscipline } from "./AutoMovieServiceDiscipline";
import { AutoMovieServiceFlow } from "./AutoMovieServiceFlow";
import { AutoMovieServiceMedium } from "./AutoMovieServiceMedium";
import { AutoMovieServiceUnit } from "./AutoMovieServiceUnit";

/**
 * One rooted distribution system: a medium, the unit it is measured in, and the
 * direction reachability is asked in.
 *
 * A system is the smallest thing that can be asked "is everything on it fed".
 * Cold water off one riser, the recirculating leg of the hot water, one
 * lighting circuit, one supply air trunk and the sprinkler main are five
 * systems, not one network with five colours, because each answers that
 * question separately.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `IAutoMovieServiceSystem` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `IAutoMovieServiceSystem` for the interior space service network contract system contract.
 */
export interface IAutoMovieServiceSystem {
  /**
   * Stable system identity within the network.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `id` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `id` for the interior space service network contract system contract.
   */
  id: string;

  /**
   * Which engineering discipline owns the system's rules.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `discipline` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `discipline` for the interior space service network contract system contract.
   */
  discipline: AutoMovieServiceDiscipline;

  /**
   * What the system carries. The discipline restricts which media are legal.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `medium` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `medium` for the interior space service network contract system contract.
   */
  medium: AutoMovieServiceMedium;

  /**
   * Unit every capacity and demand on the system is stated in.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `unit` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `unit` for the interior space service network contract system contract.
   */
  unit: AutoMovieServiceUnit;

  /**
   * How reachability is traversed from {@link root}.
   *
   * - `from-root`: the root emits and everything else consumes — a supply main, a
   *   lighting circuit, a supply air trunk.
   * - `to-root`: the root receives and everything else discharges — a drainage
   *   stack, a return air path, an exhaust riser.
   * - `undirected`: a ring or bus where either end may feed the other.
   *
   * It never changes what a segment _means_: a segment always carries its
   * medium out of its `from` port and into its `to` port.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `flow` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `flow` for the interior space service network contract system contract.
   */
  flow: AutoMovieServiceFlow;

  /**
   * Node id the system is rooted at: the main, the panel, the stack base, the
   * riser head. Reachability is measured from here, so every node carrying a
   * port on this system is expected to be joined to it.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `root` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `root` for the interior space service network contract system contract.
   */
  root: string;

  /**
   * Design capacity in {@link unit}; a finite number greater than `0`.
   *
   * The engine sums the demand declared at the ports facing away from
   * {@link root} against it, which is the end a system is loaded from: what the
   * `in` ports of a `from-root` or `undirected` system draw, and what the `out`
   * ports of a `to-root` system discharge. A `bidirectional` port is counted at
   * neither end, so a ring tap states its draw on the port that draws it.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `capacity` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `capacity` for the interior space service network contract system contract.
   */
  capacity: number;
}
