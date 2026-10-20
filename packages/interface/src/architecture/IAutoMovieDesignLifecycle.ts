/**
 * When one subject enters and leaves the work.
 *
 * Every declared subject carries exactly one of these. Totality is the point:
 * the alternative is a default, and any default here would be a claim nobody
 * made, either that an element predates the work or that it survives it.
 *
 * When both ends are set, the installing phase must be a strict, possibly
 * indirect prerequisite of the removing phase, so installing and removing in
 * the same phase is refused.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignLineage` resolves the subject and both phase ids, refuses a second lifecycle for one subject or a subject with none, and, when both ends are set, requires the installing phase among the removing phase's transitive `requires` collected by breadth-first walk.
 * @evidence contracts/common.md#clear-and-simple-design Two nullable phase ids carry the whole lifecycle; the role and per-phase presence are derived from them by `designLineagePhaseSnapshot` instead of being stored a second time.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A subject missing a lifecycle is refused rather than given a predates-and-survives default, and an incomparable install and removal on parallel branches is refused rather than ordered by array position.
 * @evidence contracts/common.md#meaningful-documentation States the one-per-subject totality and why, what null means at each end, and the strict transitive ordering both ends must satisfy.
 */
export interface IAutoMovieDesignLifecycle {
  /** Declared subject id this record is about. */
  subject: string;

  /** Declared phase that installs it, or null when it predates the work. */
  introducedIn: string | null;

  /** Declared phase that removes it, or null when it outlives the work. */
  removedIn: string | null;
}
