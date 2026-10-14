import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { IAutoMovieBuiltPlacementOverlapPair } from "./IAutoMovieBuiltPlacementOverlapPair";

/**
 * What one whole-building overlap sweep measured, and what it cost.
 *
 * `compared` counts active union-box candidates after X pruning. It excludes shared batch staging/tessellation, body resolution, sorting, active-list prune/splice work, part-pair volume folds and result sorting; it is not total operation count or elapsed cost. Current sweeps share one element part table and world staging rather than restaging per body. Population lookup can still be quadratic and explicit populations add stored-transform work.
 *
 * @evidence contracts/common.md#principled-implementation The sweep sorts resolved bodies by their lower x corner and keeps an active list, so `compared` counts only the union-box tests the x-axis prune leaves, and each admitted pair is then confirmed part box against part box before it lands in `pairs`.
 * @evidence contracts/common.md#clear-and-simple-design Census, proxy findings and unresolved locators travel together. Empty pairs with no unresolved bodies establishes only that this static box-volume sweep emitted no findings; it does not certify a clean rendered building, continuous collision freedom or structural correctness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolved locators are listed and present-body derivation errors still propagate. No overlap threshold or fixture identity selects findings; volume <= 0 suppresses nonpositive computed intersections, while nonfinite grading remains the pair record's stated limitation. `compared` does not conceal a claim of total cost.
 * @evidence contracts/common.md#meaningful-documentation States resolved-body and candidate counters, batch sharing and excluded cost, proxy/numeric result limits, finite-metric pair sorting and declaration-order unresolved locators.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapReport {
  /** Bodies whose extent resolved and were therefore compared. */
  measured: number;

  /** Union-box pair tests performed after pruning, the sweep's own cost. */
  compared: number;

  /**
   * Every emitted intersecting proxy pair, larger fraction first, then larger shared volume, otherwise sweep order under finite comparable grading metrics. NaN grading does not establish that numeric ordering.
   */
  pairs: IAutoMovieBuiltPlacementOverlapPair[];

  /**
   * Bodies whose extent the record does not resolve, so nothing compared them;
   * elements in record order, then populations.
   */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
