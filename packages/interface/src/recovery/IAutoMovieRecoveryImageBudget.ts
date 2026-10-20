/**
 * Explicit population limits for synchronous image observation.
 * These are caller-supplied counts, not physical dimensions or image resampling settings.
 *
 * @evidence contracts/common.md#principled-implementation Positive safe-integer limits bound total pixels, view records and retained support rows before their corresponding populations are assembled.
 * @evidence contracts/common.md#clear-and-simple-design One named budget groups the three existing capture limits without introducing fitting policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exhaustion does not authorize dropping views, resampling pixels or discarding measured rows.
 * @evidence contracts/common.md#meaningful-documentation States count units, positivity and the population governed by each limit.
 */
export interface IAutoMovieRecoveryImageBudget {
  /** Maximum total width times height across all views; positive safe integer. */
  maxPixels: number;

  /** Maximum number of view records; positive safe integer. */
  maxViews: number;

  /** Maximum total retained foreground-support rows; positive safe integer. */
  maxRows: number;
}
