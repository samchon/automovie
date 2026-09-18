import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";
import { IAutoMovieSubjectChange } from "./IAutoMovieSubjectChange";

/**
 * Structural comparison of two compiled subject inventories.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Exposes render-free added, removed, moved, reshaped, and unchanged results.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Defines the portable categorized diff contract.
 */
export interface IAutoMovieSubjectDiff {
  /**
   * Structural-diff schema version.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Makes the portable diff version explicit.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types the first diff schema.
   */
  version: 1;
  /**
   * Revision of the earlier compiled artifact.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Identifies the baseline used by the comparison.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Carries the prior artifact revision.
   */
  fromRevision: string;
  /**
   * Revision of the later compiled artifact.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Identifies the candidate used by the comparison.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Carries the next artifact revision.
   */
  toRevision: string;
  /**
   * Inclusive absolute numeric tolerance used by this comparison.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Makes numeric comparison policy visible to the reviewer.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Carries the finite non-negative comparison threshold.
   */
  tolerance: number;
  /**
   * Subjects present only in the later revision.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Reports compiled additions as a distinct category.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types exclusive added records.
   */
  added: IAutoMovieSubjectChange[];
  /**
   * Subjects present only in the earlier revision.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Reports compiled removals as a distinct category.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types exclusive removed records.
   */
  removed: IAutoMovieSubjectChange[];
  /**
   * Common subjects whose placement state changed.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Reports transform, owner, space, or prototype placement changes.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types the non-exclusive moved category.
   */
  moved: IAutoMovieSubjectChange[];
  /**
   * Common subjects whose reusable structure or population law changed.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Reports geometry and compact-population changes.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types the non-exclusive reshaped category.
   */
  reshaped: IAutoMovieSubjectChange[];
  /**
   * Bounded summary of common subjects in neither changed category.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Makes a no-change result explicit and reviewable.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Carries deterministic bounded unchanged identity.
   */
  unchanged: IAutoMovieSubjectMemberSummary;
}
