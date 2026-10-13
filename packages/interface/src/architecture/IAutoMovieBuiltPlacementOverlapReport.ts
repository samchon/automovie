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
 * It does not include body resolution. Each element is resolved through a call
 * that re-stages the whole element hierarchy, so resolving every body costs
 * time quadratic in the element count whatever `compared` reads.
 *
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapReport {
  /** Bodies whose extent resolved and were therefore compared. */
  measured: number;

  /** Union-box pair tests performed after pruning, the sweep's own cost. */
  compared: number;

  /**
   * Every intersecting pair, deepest share of the smaller body first, then
   * larger shared volume first.
   */
  pairs: IAutoMovieBuiltPlacementOverlapPair[];

  /**
   * Bodies whose extent the record does not resolve, so nothing compared them;
   * elements in record order, then populations.
   */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
