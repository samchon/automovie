import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { IAutoMovieBuiltPlacementOverlapPair } from "./IAutoMovieBuiltPlacementOverlapPair";

/**
 * What one whole-building overlap sweep measured, and what it cost.
 *
 * `compared` is the number of union-box pair tests the sweep performed after
 * pruning, so a caller deciding whether to run the check every round reads its
 * cost from the answer instead of from a separate benchmark.
 *
 * It does not count body resolution. Each element is resolved through a call
 * that stages the whole element hierarchy, so resolving every body costs time
 * quadratic in the element count whatever `compared` reads.
 *
 * @evidence contracts/common.md#principled-implementation The sweep sorts resolved bodies by their lower x corner and keeps an active list, so `compared` counts only the union-box tests the x-axis prune leaves, and each admitted pair is then confirmed part box against part box before it lands in `pairs`.
 * @evidence contracts/common.md#clear-and-simple-design Census counts, the findings, and the unresolved locators sit in one report, because an empty `pairs` list means a clean building only when `unresolved` is also empty.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The quadratic cost of resolving every element is stated in the prose rather than left out of `compared`'s meaning, and unresolved bodies are listed instead of silently dropped.
 * @evidence contracts/common.md#meaningful-documentation States what `measured` and `compared` count, which cost `compared` omits and why it is quadratic, the sort order of `pairs`, and the order of `unresolved`.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapReport {
  /** Bodies whose extent resolved and were therefore compared. */
  measured: number;

  /** Union-box pair tests performed after pruning, the sweep's own cost. */
  compared: number;

  /**
   * Every intersecting pair, larger fraction of the smaller body first, then
   * larger shared volume first, and otherwise in sweep order.
   */
  pairs: IAutoMovieBuiltPlacementOverlapPair[];

  /**
   * Bodies whose extent the record does not resolve, so nothing compared them;
   * elements in record order, then populations.
   */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
