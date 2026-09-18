/**
 * Maximum stable subject ids included in one membership summary.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Bounds inspection output even when one prototype or set has thousands of uses.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Fixes the deterministic sample limit used beside exact member totals.
 */
export const AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT = 64;
