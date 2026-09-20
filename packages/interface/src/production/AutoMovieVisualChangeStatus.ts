/**
 * Exhaustive status of one subject-view identity across two revisions.
 *
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Keeps unchanged observations visible beside changed, new, and gone observations.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Types the four mutually exclusive outcomes of the identity join.
 */
export type AutoMovieVisualChangeStatus =
  | "changed"
  | "unchanged"
  | "new"
  | "gone";
