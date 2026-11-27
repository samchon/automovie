import type {
  IAutoMovieRecoveryCurvatureReport,
  IAutoMovieRecoveryFeasibleDiagnostics,
  IAutoMovieRecoveryRegularizationReport,
} from "..";

/** Local joint-refinement diagnostics on one fixed observation population. */
export interface IAutoMovieRecoveryMapJointFit {
  /** Local numerical stopping condition, not global accuracy or uncertainty. */
  converged: boolean;

  /**
   * Numerical stop; pixel-kkt is normal constrained stationarity, while
   * direction-incomplete, abnormal-or-stalled and iteration-budget are
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
   * Nonlinear attempts; feasible mode counts every actual evaluation, including
   * qualified unselected and rejected candidates.
   */
  iterations: number;

  /**
   * Selected state updates decreasing the actual complete-population robust
   * objective; qualified unselected evaluations are excluded.
   */
  acceptedSteps: number;

  /**
   * Same observations used in both initial and final objectives; none is
   * silently dropped during this fit.
   */
  observationCount: number;

  /** Initial sum s^2*(sqrt(1+norm2(r)/s^2)-1), in squared pixels. */
  initialCost: number;

  /**
   * Final robust sum over exactly observationCount measurements, in squared
   * pixels.
   */
  finalCost: number;

  /**
   * Initial sum of squared two-coordinate pixel residual norms over the same
   * observations.
   */
  initialSquaredError: number;

  /**
   * Final unweighted squared error; robust descent need not decrease this
   * distinct quantity.
   */
  finalSquaredError: number;

  /** Smallest observed undamped column-scaled reduced-camera singular ratio. */
  minimumCameraDesignRatio: number;

  /** Smallest observed undamped column-scaled point-block singular ratio. */
  minimumPointDesignRatio: number;

  /**
   * Present only for internal accepted-agreement regularization; fit-local
   * scalar reactions never replace normal convergence or data rank.
   */
  regularization?: IAutoMovieRecoveryRegularizationReport;

  /**
   * Present only for requested internal lagged curvature; fixed model-use
   * counters are independent of original rank, actual selection and normal
   * convergence.
   */
  curvature?: IAutoMovieRecoveryCurvatureReport;

  /**
   * Completed feasible-fit normal/QP/SQP/trial diagnostics; absent for ordinary
   * fits and older artifacts, without implying no fit ran. Nonfinite values use
   * explicit JSON sentinels.
   */
  feasible?: IAutoMovieRecoveryFeasibleDiagnostics;
}
