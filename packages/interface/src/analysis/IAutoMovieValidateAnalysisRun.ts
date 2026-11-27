import type { IAutoMovieAnalysisRun } from "./IAutoMovieAnalysisRun";

/** Data and callback contracts shared by the ValidateAnalysisRun operations. */
export namespace IAutoMovieValidateAnalysisRun {
  /**
   * Validate one analysis run as evidence.
   *
   * The contents follow `validateAnalysisRunContents`: an absent
   * measurement must stay visibly absent, and a spatial sample may only field a
   * metric that produced a value. On top of that the digest is recomputed, so a
   * run whose outcome was edited after sealing fails here rather than being
   * read as a measurement.
   *
   * Passing `revision` additionally asks whether the run is still about the
   * current design. A run that read an older revision is reported as stale: it
   * was a real measurement of a building that no longer exists.
   *
   * Every violation is returned rather than thrown, with paths rooted at
   * `$input`: the contents first, then the digest, then staleness. The rules
   * are semantic: the run must already have the declared shape, because nested
   * fields such as `solver.id` are read without a guard, so a JSON value
   * missing one throws a `TypeError` instead of producing a violation.
   */
  export type IProps = {
    /** Run to check; it must already have the declared shape. */
    run: IAutoMovieAnalysisRun;

    /** Current design revision, when staleness is being checked. */
    revision?: string;
  };
}
