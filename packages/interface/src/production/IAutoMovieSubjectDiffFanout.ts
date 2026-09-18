import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Aggregate consequence of one structural subject change.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Reports prototype consequences without emitting one record per use.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Types bounded element, set, instance, and prototype-selection fan-out.
 */
export interface IAutoMovieSubjectDiffFanout {
  /**
   * Number of scene elements whose geometry references the changed prototype.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Quantifies prototype use by placed elements without duplicate change entries.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Carries the aggregate referencing-element count.
   */
  elements: number;
  /**
   * Number of compact instance slots whose geometry references the prototype.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Quantifies repeated prototype use without member-sized output.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Carries the aggregate referencing-instance count.
   */
  instances: number;
  /**
   * Bounded identities of compact sets represented by {@link instances}.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Keeps affected instance sets addressable while bounding output.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Carries the deterministic set-id summary.
   */
  instanceSets: IAutoMovieSubjectMemberSummary;
  /**
   * Number of slots whose selected prototype differs between set revisions.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Summarizes instance prototype changes without per-slot diff records.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Counts changed common selections plus added or removed slots.
   */
  prototypeChanges: number;
}
