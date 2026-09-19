/**
 * Result of comparing required subject viewpoints with current observations.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-coverage Separates planned, observed and missing subject-view coverage.
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Distinguishes current, stale, partial, not-run and indeterminate evidence states.
 * @evidence requirements/review/subject-inspection.md#review-subject-time-noninterchange Reports foreign evidence without counting it toward subject coverage.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-coverage Types the explicit numerator, denominator, omissions and duplicate accounting of one subject review.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-freshness Carries stale viewpoint identities separately from current coverage.
 * @evidence specifications/review-and-acceptance/target-scope-and-context.md#review-system-context-unavailable Represents missing, stale, partial, not-run, and indeterminate subject context without converting it into a passing observation.
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewCoverage {
  /** Derived execution state for this subject and plan. */
  state: "indeterminate" | "not-run" | "partial" | "stale" | "reviewed";

  /** Required viewpoint ids in declared plan order. */
  planned: string[];

  /** Required viewpoint ids covered at the current subject revision. */
  observed: string[];

  /** Required viewpoint ids with no current observation. */
  missing: string[];

  /** Required viewpoint ids observed only at another revision. */
  stale: string[];

  /** Extra current observations for a viewpoint outside the plan. */
  unplanned: string[];

  /** Records for another subject or another evidence kind. */
  foreign: number;

  /** Redundant current records beyond the first record per viewpoint. */
  duplicates: number;
}
