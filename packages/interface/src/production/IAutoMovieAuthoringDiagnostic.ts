import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * One actionable failure at the public authoring boundary, as
 * `compileDefinedShot` reports it in a failed `IAutoMovieCompiledDefinedShot`.
 *
 * Every diagnostic states the observed fact, why it blocks a trustworthy shot
 * artifact, and the concrete correction. All diagnostics of one failure come
 * from the first phase that failed, so a correction round never mixes a stage
 * error with performance errors computed on a broken stage.
 */
export interface IAutoMovieAuthoringDiagnostic {
  /**
   * Stable machine-readable category: `registration-invalid` in registration,
   * `builder-failed` in build, `contract-mismatch` in build or performance,
   * `contract-realization-failed` in contract, `stage-invalid`,
   * `blocking-invalid` and `performance-invalid` in their own phases, and
   * `pipeline-failed` for an unexpected exception in any phase.
   */
  code:
    | "registration-invalid"
    | "builder-failed"
    | "contract-mismatch"
    | "contract-realization-failed"
    | "stage-invalid"
    | "blocking-invalid"
    | "performance-invalid"
    | "pipeline-failed";

  /** Pipeline phase that owns the correction. */
  phase:
    | "registration"
    | "build"
    | "stage"
    | "blocking"
    | "performance"
    | "contract"
    | "continuity";

  /**
   * Exact source or generated field that failed, such as a violation path, or
   * `$<phase>` when an exception has no narrower field.
   */
  path: string;

  /** What was observed, including the offending identity or value. */
  fact: string;

  /** Why the failure prevents a trustworthy shot artifact. */
  impact: string;

  /** Concrete source edit or input correction that permits the next attempt. */
  recovery: string;

  /**
   * Original domain violation, present for `stage-invalid`, `blocking-invalid`
   * and `performance-invalid`; absent when no lower engine gate produced one.
   */
  violation?: IAutoMovieConstraintViolation;
}
