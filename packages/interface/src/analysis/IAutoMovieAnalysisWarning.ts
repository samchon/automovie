/**
 * Something the solver noticed that does not invalidate the result.
 *
 * Warnings exist only on a solved run, and a metric's status is never derived
 * from them. The code set is open; the engine solvers currently emit
 * `target-unit-mismatch`, `target-key-unknown`, `reverse-heat-flow` and
 * `luminaire-on-workplane`.
 *
 * @evidence contracts/development/design.md#principled-representation An open-code record that `validateAutoMovieAnalysisRun` checks for a non-blank code and detail and a null or non-blank subject; the run digest serializes each warning as one JSON tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A string code rather than a closed union, because warnings are advisory and the summarizer neither counts nor branches on them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A warning cannot stand in for a failure: an input that makes a metric unmeasurable must produce a gap, and only the solved arm of an outcome has a warning list.
 * @evidence contracts/development/common.md#meaningful-documentation States where warnings may appear, that statuses ignore them, the codes the engine emits today, and when the subject is null.
 */
export interface IAutoMovieAnalysisWarning {
  /** Non-blank stable warning code such as `target-unit-mismatch`. */
  code: string;

  /** Non-blank human-readable detail. */
  detail: string;

  /**
   * Non-blank input the warning is about, or null when it is about the run.
   */
  subject: string | null;
}
