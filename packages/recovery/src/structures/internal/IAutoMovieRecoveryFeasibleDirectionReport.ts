import type { IAutoMovieRecoveryFeasibleDirection } from "./IAutoMovieRecoveryFeasibleDirection";

/**
 * Scalar termination evidence for the most recent feasible-direction model.
 *
 * @evidence contracts/common.md#principled-implementation The report retains the actual inner stop, numerical certificate and original-row residuals separately from nonlinear KKT, without inferring an unobserved cause of incomplete refinement.
 * @evidence contracts/common.md#clear-and-simple-design A named scalar projection reuses the exact direction semantics while omitting full steps and multipliers from the nonlinear report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truncated objective, hidden failed predicate or numerical-limit relabeling supplies success.
 * @evidence contracts/common.md#meaningful-documentation Inherited fields keep actual inner termination, gap, arithmetic allowances and work; only array-valued step and multipliers are excluded.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no numerical operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One constant-size latest-model record transfers; it contains no trajectory, image, array or external handle.
 */
export interface IAutoMovieRecoveryFeasibleDirectionReport extends Omit<
  IAutoMovieRecoveryFeasibleDirection,
  "step" | "multipliers"
> {}
