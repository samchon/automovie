/**
 * Local joint-refinement diagnostics on one fixed observation population.
 *
 * @evidence contracts/common.md#principled-implementation Actual vector-wise soft-L1 pixel cost, independent undamped point/camera design ratios and explicit local termination distinguish descent from observability and convergence.
 * @evidence contracts/common.md#clear-and-simple-design One owned report accompanies the joint camera/point result without numerical scratch or expected values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A lower objective does not imply physical truth, metric scale, covariance, global optimum or success after dropping measurements.
 * @evidence contracts/common.md#meaningful-documentation Fields give population, cost normalization, units, work counts and local-convergence limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The report performs no fitting work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only plain values belong to the caller and no resource is acquired.
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

  /** Accepted and rejected nonlinear iterations combined. */
  iterations: number;

  /** Trials decreasing the actual complete-population robust objective. */
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
}
