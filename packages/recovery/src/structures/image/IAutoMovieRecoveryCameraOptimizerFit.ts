/**
 * Termination and objective diagnostics of one fixed-subset local pose fit.
 *
 * @evidence contracts/development/design.md#principled-representation Numerical convergence qualifies only the fixed-subset local objective; iteration exhaustion remains explicitly unfinished.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish attempted iterations, accepted updates, stopping reason, squared-pixel costs and scaled Jacobian rank.
 */
export interface IAutoMovieRecoveryCameraOptimizerFit {
  /** Actual attempted local steps. */
  iterations: number;

  /** Steps admitted by a decreasing actual robust objective. */
  acceptedSteps: number;

  /** Local stopping reason; iteration-budget remains unfinished. */
  termination: "gradient" | "step" | "cost" | "iteration-budget";

  /** Whether the fixed-subset local numerical stopping rule completed. */
  converged: boolean;

  /** Initial soft-L1 objective in squared pixels under the declared scale. */
  initialCost: number;

  /** Final soft-L1 objective for the same fixed subset. */
  finalCost: number;

  /** Smallest scaled original-Jacobian singular ratio visited by that fit. */
  minimumLocalDesignRatio: number;
}
