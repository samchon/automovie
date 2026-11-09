import type { IAutoMovieRecoveryFeasibleDirection } from "./IAutoMovieRecoveryFeasibleDirection";

/**
 * Scalar termination evidence for the most recent feasible-direction model.
 *
 * @evidence contracts/development/design.md#principled-representation The report retains the actual inner stop, numerical certificate and original-row residuals separately from nonlinear KKT, without inferring an unobserved cause of incomplete refinement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A named scalar projection reuses the exact direction semantics while omitting full steps and multipliers from the nonlinear report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No truncated objective, hidden failed predicate or numerical-limit relabeling supplies success.
 * @evidence contracts/development/common.md#meaningful-documentation Inherited fields keep actual inner termination, gap, arithmetic allowances and work; only array-valued step and multipliers are excluded.
 */
export interface IAutoMovieRecoveryFeasibleDirectionReport extends Omit<
  IAutoMovieRecoveryFeasibleDirection,
  "step" | "multipliers"
> {}
