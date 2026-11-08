import type { IAutoMovieRecoveryCurvatureReport } from "./IAutoMovieRecoveryCurvatureReport";
import type { IAutoMovieRecoveryFeasibleDiagnostics } from "./IAutoMovieRecoveryFeasibleDiagnostics";
import type { IAutoMovieRecoveryRegularizationReport } from "./IAutoMovieRecoveryRegularizationReport";

/**
 * Local joint-refinement diagnostics on one fixed observation population.
 *
 * @evidence contracts/development/design.md#principled-representation Actual vector-wise soft-L1 pixel cost, independent undamped point/camera design ratios and explicit local termination distinguish descent from observability and convergence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One owned report accompanies the joint camera/point result without numerical scratch or expected values.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A lower objective does not imply physical truth, metric scale, covariance, global optimum or success after dropping measurements.
 * @evidence contracts/development/common.md#meaningful-documentation Fields give population, cost normalization, units, actual/selected counts and local-convergence limits. Optional fit-local regularization metadata reports computed accepted-step reactions independently of rank, normal KKT and accuracy.
 */
export interface IAutoMovieRecoveryMapJointFit {
  /** Local numerical stopping condition, not global accuracy or uncertainty. */
  converged: boolean;

  /** Numerical stop; pixel-kkt is normal constrained stationarity, while direction-incomplete, abnormal-or-stalled and iteration-budget are nonconverged. */
  termination:
    | "gradient"
    | "step"
    | "cost"
    | "iteration-budget"
    | "pixel-kkt"
    | "direction-incomplete"
    | "abnormal-or-stalled";

  /** Nonlinear attempts; feasible mode counts every actual evaluation, including qualified unselected and rejected candidates. */
  iterations: number;

  /** Selected state updates decreasing the actual complete-population robust objective; qualified unselected evaluations are excluded. */
  acceptedSteps: number;

  /** Same observations used in both initial and final objectives; none is silently dropped during this fit. */
  observationCount: number;

  /** Initial sum s^2*(sqrt(1+norm2(r)/s^2)-1), in squared pixels. */
  initialCost: number;

  /** Final robust sum over exactly observationCount measurements, in squared pixels. */
  finalCost: number;

  /** Initial sum of squared two-coordinate pixel residual norms over the same observations. */
  initialSquaredError: number;

  /** Final unweighted squared error; robust descent need not decrease this distinct quantity. */
  finalSquaredError: number;

  /** Smallest observed undamped column-scaled reduced-camera singular ratio. */
  minimumCameraDesignRatio: number;

  /** Smallest observed undamped column-scaled point-block singular ratio. */
  minimumPointDesignRatio: number;

  /** Present only for internal accepted-agreement regularization; fit-local scalar reactions never replace normal convergence or data rank. */
  regularization?: IAutoMovieRecoveryRegularizationReport;

  /** Present only for requested internal lagged curvature; fixed model-use counters are independent of original rank, actual selection and normal convergence. */
  curvature?: IAutoMovieRecoveryCurvatureReport;

  /** Completed feasible-fit normal/QP/SQP/trial diagnostics; absent for ordinary fits and older artifacts, without implying no fit ran. Nonfinite values use explicit JSON sentinels. */
  feasible?: IAutoMovieRecoveryFeasibleDiagnostics;
}
