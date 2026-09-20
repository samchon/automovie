/**
 * Exact cardinalities of the complete four-state comparison.
 *
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Reports exact totals without omitting unchanged observations.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Types the four counts whose sum equals the returned view population.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualChangeCounts {
  /**
   * Common identities whose image digests differ.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Counts changed observations.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Counts the unequal-digest common branch.
   */
  changed: number;

  /**
   * Common identities whose image digests are equal.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Counts unchanged observations as first-class facts.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Counts the equal-digest common branch.
   */
  unchanged: number;

  /**
   * Identities found only in the later snapshot.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Counts new observations.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Counts the later-only branch.
   */
  new: number;

  /**
   * Identities found only in the earlier snapshot.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Counts gone observations.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Counts the earlier-only branch.
   */
  gone: number;
}
