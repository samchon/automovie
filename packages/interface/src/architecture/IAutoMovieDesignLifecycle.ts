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
 * @evidence contracts/common.md#principled-implementation Two nullable phase ids per subject with null meaning before or after the work; `validateDesignLineage` requires both to resolve and, when both are set, walks the removing phase's prerequisites breadth-first to confirm the installing phase strictly precedes it.
 * @evidence contracts/common.md#clear-and-simple-design Three fields; the whole-work role (retained, demolished, temporary, new) is derived from which ends are null by `designLineagePhaseSnapshot` rather than stored a second time.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default lifecycle is supplied for an uncovered subject; a missing or duplicated record is refused, which is the contract's deliberate totality rule.
 * @evidence contracts/common.md#meaningful-documentation States the subject, the null meaning of each end, the exactly-one-per-subject rule, and the strict ordering required between install and removal.
 * @author Samchon
 */
export interface IAutoMovieDesignLifecycle {
  /** Declared subject id this record is about. */
  subject: string;

  /** Phase that installs it, or null when it predates the work. */
  introducedIn: string | null;

  /** Phase that removes it, or null when it outlives the work. */
  removedIn: string | null;
}
