import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";
import type { IAutoMovieBuiltPlacementOverlapPair } from "./IAutoMovieBuiltPlacementOverlapPair";

/**
 * What one whole-building overlap sweep measured, and what it cost.
 *
 * `compared` counts active union-box candidates after X pruning. It excludes
 * shared batch staging/tessellation, body resolution, sorting, active-list
 * prune/splice work, part-pair volume folds and result sorting; it is not total
 * operation count or elapsed cost. Current sweeps share one element part table
 * and world staging rather than restaging per body. Population lookup can still
 * be quadratic and explicit populations add stored-transform work.
 */
export interface IAutoMovieBuiltPlacementOverlapReport {
  /** Bodies whose extent resolved and were therefore compared. */
  measured: number;

  /** Union-box pair tests performed after pruning, the sweep's own cost. */
  compared: number;

  /**
   * Every emitted intersecting proxy pair, larger fraction first, then larger
   * shared volume, otherwise sweep order under finite comparable grading
   * metrics. NaN grading does not establish that numeric ordering.
   */
  pairs: IAutoMovieBuiltPlacementOverlapPair[];

  /**
   * Bodies whose extent the record does not resolve, so nothing compared them;
   * elements in record order, then populations.
   */
  unresolved: IAutoMovieBuiltPlacementBodyLocator[];
}
