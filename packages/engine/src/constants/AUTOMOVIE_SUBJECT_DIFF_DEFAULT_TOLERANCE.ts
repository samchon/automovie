/**
 * Default inclusive absolute tolerance for compiled structural comparison.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Makes the default numeric comparison threshold stable and caller-visible.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Implements the specified `1e-6` inclusive default.
 */
export const AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE = 1e-6;
