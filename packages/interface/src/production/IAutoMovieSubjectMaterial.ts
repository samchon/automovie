/**
 * One material directly used by the described subject.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Makes subject material composition available to a reviewer.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Types the compact material projection of the compiled model.
 */
export interface IAutoMovieSubjectMaterial {
  /**
   * Stable material id inside its model.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Identifies the material a subject uses.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Carries the compiled material identity.
   */
  id: string;

  /**
   * Human-readable compiled material name, or null when unnamed.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Gives material identity a reviewable label when one was authored.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Projects the compiled material label without inventing one.
   */
  name: string | null;
}
