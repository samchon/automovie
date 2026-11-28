/**
 * Numerical report for one fixed-subset relative-pose optimizer. The cost uses
 * robust signed Sampson residuals in the original pixel charts.
 */
export interface IAutoMovieRecoveryCameraOptimizerFit {
  /**
   * Number of local update attempts. A gradient stop can occur before a trial
   * step.
   */
  iterations: number;

  /** Number of accepted updates that strictly lowered the fixed-set robust cost. */
  acceptedSteps: number;

  /** Stopping condition recorded by the local optimizer. */
  termination: "gradient" | "step" | "cost" | "iteration-budget";

  /** Whether the optimizer reached a gradient, step or cost stop. */
  converged: boolean;

  /**
   * Initial soft-L1 objective of the signed Sampson residuals, in squared
   * pixels.
   */
  initialCost: number;

  /** Final robust objective on the same fixed subset, in squared pixels. */
  finalCost: number;

  /**
   * Smallest visited smallest-to-largest singular value ratio of the weighted,
   * column-scaled undamped Jacobian.
   */
  minimumLocalDesignRatio: number;
}
