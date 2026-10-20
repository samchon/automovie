import type { IAutoMovieRecoveryCameraHomographyConsensus } from "./IAutoMovieRecoveryCameraHomographyConsensus";
import type { IAutoMovieRecoveryCameraOptimizerFit } from "./IAutoMovieRecoveryCameraOptimizerFit";

/**
 * Final calibrated support and independent camera-qualification diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Final subset stability, original-design rank, pixel residuals, positive depths, parallax and planar competition qualify different premises.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/common.md#meaningful-documentation Members state actual and required work, null diagnostics, complete residual populations and image extent without a surface-coverage claim.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no computation; producing operations document their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain values belong to the caller; the declaration acquires no handle or running task.
 */
export interface IAutoMovieRecoveryCameraConsensus {
  /** Actual eight-point proposal count, including numerical refusals. */
  trials: number;

  /** Required ideal all-inlier trials at the final support; null denotes an unattainable finite target. */
  requiredTrialsAtFinalSupport: number | null;

  /** Operational trial target only; deterministic finite-generator proposals do not certify physical correctness. */
  conditionalTrialTargetMet: boolean;

  /** Proposal models refused by their declared numerical owners. */
  numericalRefusals: number;

  /** Eligible proposals refined in draw order before winner comparison, bounded by the declared local budget. */
  localRefinements: number;

  /** Nonconverged local proposals or final re-estimation failures, including provisional changing subsets. Unexpected runtime errors fail the operation instead. */
  localRefinementRefusals: number;

  /** Final re-estimations, including repeats after a changed sampling target. */
  finalReestimations: number;

  /** True only when every final fixed-subset optimizer terminates and its final inlier set stabilizes. */
  finalRefinementConverged: boolean;

  /** Final fixed-subset optimizer diagnostics, empty when no final optimizer completed. */
  optimizerFits: IAutoMovieRecoveryCameraOptimizerFit[];

  /** Eighth/largest original-design singular ratio on the entire final inlier population, null without a resolved fit. */
  finalDesignSingularRatio: number | null;

  /** Final calibrated epipolar inlier count. */
  inliers: number;

  /** Inlier count divided by all tentative matches. */
  inlierFraction: number;

  /** Final inlier median mean-two-sided point-to-line distance in pixels, or null without finite support. */
  medianSymmetricPointLinePx: number | null;

  /** Final inlier linear-interpolated 90th percentile point-to-line distance in pixels. */
  p90SymmetricPointLinePx: number | null;

  /** Fractions of original pixel-chart area enclosed by observed inlier convex hulls, first/second; no surface coverage claim. */
  inlierImageHullFractions: [number, number] | null;

  /** Positive-in-both-cameras count divided by all final inliers, or null without a resolved candidate. */
  positiveDepthFraction: number | null;

  /** Median ray angle for finite positive-depth points in radians, or null when absent. */
  medianParallaxRadians: number | null;

  /** Four positive-depth counts; a tied maximum cannot qualify a unique camera. */
  allPositiveDepthCounts: number[];

  /** Null without four final epipolar inliers to test the planar competitor. */
  homography: IAutoMovieRecoveryCameraHomographyConsensus | null;
}
