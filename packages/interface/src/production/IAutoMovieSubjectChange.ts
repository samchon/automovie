import { AutoMovieSubjectKind } from "./AutoMovieSubjectKind";
import { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";
import { IAutoMovieSubjectDiffFanout } from "./IAutoMovieSubjectDiffFanout";

/**
 * One subject entry in a structural diff category.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Gives added, removed, moved, and reshaped categories stable subject records.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types the before/after pair and aggregate consequence of one change.
 */
export interface IAutoMovieSubjectChange {
  /**
   * Stable subject id shared with the non-null description.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Identifies the changed compiled subject.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Uses stable id as the comparison key.
   */
  id: string;

  /**
   * Structural kind of the changed subject.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Keeps each change interpretable by subject role.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Carries the common role discriminator.
   */
  kind: AutoMovieSubjectKind;

  /**
   * Subject before the change, or null for an addition.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Makes the prior compiled state inspectable.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types the nullable prior state.
   */
  before: IAutoMovieSubjectDescription | null;

  /**
   * Subject after the change, or null for a removal.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-structural-change Makes the next compiled state inspectable.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-structural-diff Types the nullable next state.
   */
  after: IAutoMovieSubjectDescription | null;

  /**
   * Aggregate placements and selections affected by this record.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Prevents prototype changes from expanding into per-use records.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Carries the bounded consequence summary.
   */
  fanout: IAutoMovieSubjectDiffFanout;
}
