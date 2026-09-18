import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { IAutoMovieBuiltPlacementOverlapPair } from "./IAutoMovieBuiltPlacementOverlapPair";

/**
 * What one whole-building overlap sweep measured, and what it cost.
 *
 * `compared` is the number of pair tests the sweep actually performed, which is
 * the honest way to state the cost of a check whose naive form is quadratic. It
 * belongs in the answer rather than in a benchmark somebody runs separately,
 * because a caller deciding whether to run this every round needs it.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Reports every intruding pair in a building beside the population and the work the sweep did.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Separates the measured population, the performed comparisons, the found pairs, and the unresolved bodies.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapReport {
  /** Bodies whose extent resolved and were therefore compared. */
  measured: number;
  /** Pair tests performed after pruning, the sweep's own cost. */
  compared: number;
  /** Every intersecting pair, deepest share of the smaller body first. */
  pairs: IAutoMovieBuiltPlacementOverlapPair[];
  /** Bodies whose extent the record does not resolve, so nothing compared them. */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
