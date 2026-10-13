/** Something the solver noticed that does not invalidate the result. */
export interface IAutoMovieAnalysisWarning {
  /** Stable warning code such as `target-unit-mismatch`. */
  code: string;

  /** Non-blank human-readable detail. */
  detail: string;

  /** Input the warning is about, or null when it is about the run. */
  subject: string | null;
}
