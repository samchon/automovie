/**
 * Something the solver noticed that does not invalidate the result.
 *
 * Warnings exist only on a solved run, and a metric's status is never derived
 * from them. The code set is open; the engine solvers currently emit
 * `target-unit-mismatch`, `target-key-unknown`, `reverse-heat-flow` and
 * `luminaire-on-workplane`.
 */
export interface IAutoMovieAnalysisWarning {
  /** Non-blank stable warning code such as `target-unit-mismatch`. */
  code: string;

  /** Non-blank human-readable detail. */
  detail: string;

  /** Non-blank input the warning is about, or null when it is about the run. */
  subject: string | null;
}
