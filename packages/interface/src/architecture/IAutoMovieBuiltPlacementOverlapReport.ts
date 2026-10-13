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
 * @evidence contracts/common.md#principled-implementation `builtEnvironmentPlacementOverlapSweep` sorts resolved bodies by lower x, keeps an active list pruned on x, tests union boxes and confirms part against part; each body resolution re-composes every element matrix, an unshared quadratic cost outside `compared`.
 * @evidence contracts/common.md#clear-and-simple-design Census counts sit beside the findings so an empty pair list can be read against how many bodies were measured and how many were left unresolved.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pruning is on one axis only, so bodies sharing an x range still cost up to quadratic union tests, which `compared` exposes instead of hiding; the hierarchy restaging per body is a real defect the count does not show.
 * @evidence contracts/common.md#meaningful-documentation States what each count measures and omits, the order of pairs and of unresolved bodies, and that unresolved bodies were never compared.
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
