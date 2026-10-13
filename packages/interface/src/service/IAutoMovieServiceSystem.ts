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
 */
export interface IAutoMovieServiceSystem {
  /** Stable system identity within the network. */
  id: string;

  /** Which engineering discipline owns the system's rules. */
  discipline: AutoMovieServiceDiscipline;

  /**
   * What the system carries. The discipline restricts which media are legal.
   */
  medium: AutoMovieServiceMedium;

  /** Unit every capacity and demand on the system is stated in. */
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
   */
  flow: AutoMovieServiceFlow;

  /**
   * Node id the system is rooted at: the main, the panel, the stack base, the
   * riser head. Reachability is measured from here, so every node carrying a
   * port on this system is expected to be joined to it.
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
   */
  capacity: number;
}
