import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * One actionable failure at the public authoring boundary, as
 * `compileDefinedShot` reports it in a failed `IAutoMovieCompiledDefinedShot`.
 *
 * Every diagnostic states the observed fact, why it blocks a trustworthy shot
 * artifact, and the concrete correction. All diagnostics of one failure come
 * from the first phase that failed, so a correction round never mixes a stage
 * error with performance errors computed on a broken stage.
 *
 * @evidence contracts/common.md#principled-implementation A fact, impact and recovery triple per failure, keyed by a closed code and phase, so an author or agent can act on each diagnostic without parsing prose, and a lower-gate violation is kept verbatim in `violation` rather than re-derived.
 * @evidence contracts/common.md#clear-and-simple-design `code` classifies the kind of failure and `phase` names who owns the correction; they stay separate because one code, `contract-mismatch` or `pipeline-failed`, is filed in more than one phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unexpected exception becomes `pipeline-failed` with its name and message in `fact` rather than being swallowed or retried, and the engine never edits the source to make a diagnostic disappear.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its result type, the first-failing-phase rule, which code is filed in which phases, what each text field must contain, and when `violation` is present.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the gates that produce diagnostics are answered on `compileDefinedShot` and the stage, blocking and performance validators.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per compile attempt; nothing caches diagnostics between attempts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Strings plus an optional reference to the violation record the lower gate created, owned by the caller's diagnostic list.
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
   * Original domain violation, present for `stage-invalid`,
   * `blocking-invalid` and `performance-invalid`; absent when no lower engine
   * gate produced one.
   */
  violation?: IAutoMovieConstraintViolation;
}
