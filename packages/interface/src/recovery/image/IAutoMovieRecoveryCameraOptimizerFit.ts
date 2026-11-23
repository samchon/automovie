/** Termination and objective diagnostics of one fixed-subset local pose fit. */
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
