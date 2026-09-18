/**
 * One compiled subject addressed independently from a film-time review target.
 *
 * The shot identifies the compiled artifact that owns the stable subject id. It
 * is not a claim that the subject review observes that shot or its camera.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-identity Keeps the review address on one stable authored subject and revision-bearing compiled artifact.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-record Types the artifact-qualified address used to resolve one subject record.
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewTarget {
  /** Compiled shot artifact that contains the subject. */
  shot: string;

  /** Stable namespaced subject id inside the compiled artifact. */
  subject: string;
}
