import type {
  IAutoMovieRecoveryCurvatureReport,
  IAutoMovieRecoveryFeasibleDiagnostics,
  IAutoMovieRecoveryRegularizationReport,
} from "..";

/**
 * Joint refinement report for a fixed population of retained calibrated pixel
 * observations. It records the completed numerical fit, including its local
 * stopping condition and available optional diagnostics.
 */
export interface IAutoMovieRecoveryMapJointFit {
  /** Whether the fit reached its local numerical convergence rule. */
  converged: boolean;

  /**
   * Recorded local stopping condition. `pixel-kkt` indicates constrained
   * stationarity, while exhausted, incomplete or stalled fits remain
   * nonconverged.
   */
  termination:
    | "gradient"
    | "step"
    | "cost"
    | "iteration-budget"
    | "pixel-kkt"
    | "direction-incomplete"
    | "abnormal-or-stalled";

  /**
   * Numerical trial count under the selected method. Feasible mode counts full
   * evaluated candidates, including qualified candidates it did not select.
   */
  iterations: number;

  /**
   * Updates selected for a strict decrease in robust cost on the complete
   * observation population.
   */
  acceptedSteps: number;

  /**
   * Number of retained measurements used by both the initial and final
   * objectives.
   */
  observationCount: number;

  /**
   * Initial soft-L1 sum of the two-coordinate residual norms, in squared
   * pixels.
   */
  initialCost: number;

  /** Final soft-L1 sum on exactly the same observations, in squared pixels. */
  finalCost: number;

  /** Initial unweighted sum of squared Euclidean pixel residual norms. */
  initialSquaredError: number;

  /**
   * Final unweighted sum of squared Euclidean pixel residual norms on the fixed
   * population.
   */
  finalSquaredError: number;

  /**
   * Smallest visited singular-value ratio of the undamped, column-scaled
   * reduced camera design.
   */
  minimumCameraDesignRatio: number;

  /**
   * Smallest visited singular-value ratio of the undamped, column-scaled point
   * blocks.
   */
  minimumPointDesignRatio: number;

  /**
   * Fit-local accepted-agreement diagnostics when that regularization option
   * runs.
   */
  regularization?: IAutoMovieRecoveryRegularizationReport;

  /**
   * Lagged-curvature admission and use diagnostics when requested by the
   * feasible method.
   */
  curvature?: IAutoMovieRecoveryCurvatureReport;

  /**
   * Completed feasible-fit diagnostics, with explicit JSON values for nonfinite
   * entries. This field can be absent for ordinary fits and older artifacts.
   */
  feasible?: IAutoMovieRecoveryFeasibleDiagnostics;
}
