/**
 * Completed collision comparison counts by evaluated resolution.
 */
export interface IAutoMovieCollisionComparisonCounts {
  /** Completed group comparisons. */
  readonly groups: number;
  /** Completed region comparisons. */
  readonly regions: number;
  /** Completed part comparisons. */
  readonly parts: number;
  /** Completed narrow shape comparisons. */
  readonly shapes: number;
}
