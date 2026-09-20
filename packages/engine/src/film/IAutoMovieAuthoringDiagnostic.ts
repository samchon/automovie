import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * One actionable failure at the public authoring boundary.
 *
 * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Exposes the failure category, owning phase, precise path, observed fact, impact, recovery, and optional lower-gate violation as one actionable authoring diagnostic.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Preserves field-addressed rejection evidence so the same invalid shot can be diagnosed and corrected without depending on an opaque thrown message.
 */
export interface IAutoMovieAuthoringDiagnostic {
  /**
   * Stable machine-readable category.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Classifies the rejected shot by a stable registration, builder, contract, stage, blocking, performance, or pipeline failure code.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Makes the rejection class machine-readable instead of deriving it from error prose.
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
  /**
   * Pipeline phase that owns the correction.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Names the registration, build, stage, blocking, performance, contract, or continuity phase that owns the correction.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Locates the deterministic pipeline boundary that rejected the shot.
   */
  phase:
    | "registration"
    | "build"
    | "stage"
    | "blocking"
    | "performance"
    | "contract"
    | "continuity";
  /**
   * Exact source or generated field that failed.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Identifies the exact source or generated field that must be inspected rather than only naming the enclosing shot.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Anchors the failure result to the same field path on every replay.
   */
  path: string;
  /**
   * What was observed, including the offending identity or value.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Records the offending identity or value observed at the addressed field.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Retains the concrete observed fact that caused the deterministic gate to fail.
   */
  fact: string;
  /**
   * Why the failure prevents a trustworthy shot artifact.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status States the concrete trust or compilation consequence of the observed failure.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Explains why the deterministic gate cannot admit the current shot artifact.
   */
  impact: string;
  /**
   * Concrete source edit or input correction that permits the next attempt.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Gives the source edit or input correction required before compilation can be attempted again.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Couples the deterministic rejection with a concrete recovery action.
   */
  recovery: string;
  /**
   * Original domain violation when a lower engine gate produced one.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Retains the typed constraint violation emitted by the lower engine gate when one exists.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Preserves the original domain-gate evidence inside the public failure result instead of flattening it into prose.
   */
  violation?: IAutoMovieConstraintViolation;
}
