/**
 * Something the solver noticed that does not invalidate the result.
 *
 * Warnings exist only on a solved run and never change a metric's status. The
 * code set is open; the engine solvers currently emit `target-unit-mismatch`,
 * `target-key-unknown`, `reverse-heat-flow` and `luminaire-on-workplane`.
 *
 * @evidence contracts/common.md#principled-implementation A coded note on a solved run; validation requires non-blank code and detail and a subject that is null or non-blank, and each warning is one line of the run digest.
 * @evidence contracts/common.md#clear-and-simple-design An open string code rather than a closed union lets each solver add codes without changing this package, at the price that the type does not enumerate them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A dropped target is reported here while its metric reads `untargeted`, so the verdict never depends on a reader noticing a warning, and no code alters how a run is tallied.
 * @evidence contracts/common.md#meaningful-documentation Names the codes the engine emits today, the null subject meaning, and that warnings belong only to solved runs and leave statuses unchanged.
 */
export interface IAutoMovieAnalysisWarning {
  /** Stable warning code such as `target-unit-mismatch`. */
  code: string;

  /** Non-blank human-readable detail. */
  detail: string;

  /**
   * Non-blank input the warning is about, or null when it is about the run.
   */
  subject: string | null;
}
