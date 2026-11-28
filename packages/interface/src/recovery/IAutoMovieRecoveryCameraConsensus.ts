import type {
  IAutoMovieRecoveryCameraHomographyConsensus,
  IAutoMovieRecoveryCameraOptimizerFit,
} from "..";

/**
 * Calibrated pair consensus measurements and independent pose qualification
 * diagnostics. Read them together with the pair estimate's final status.
 */
export interface IAutoMovieRecoveryCameraConsensus {
  /**
   * Eight-point proposals evaluated, including those with a refused numerical
   * design.
   */
  trials: number;

  /**
   * Ideal unique-eight-sample trial target recomputed at the final support, or
   * null when a finite target is unavailable.
   */
  requiredTrialsAtFinalSupport: number | null;

  /**
   * Whether proposal count satisfied both the configured minimum and the ideal
   * target for the final support.
   */
  conditionalTrialTargetMet: boolean;

  /** Raw proposal fits refused by the design, calibration or scoring owner. */
  numericalRefusals: number;

  /**
   * Eligible raw proposals entering local optimization within its draw-order
   * budget.
   */
  localRefinements: number;

  /**
   * Unfinished or numerically refused local refits, plus recognized numerical
   * exceptions in final re-estimation.
   */
  localRefinementRefusals: number;

  /**
   * Final support re-estimation attempts, including subsequent attempts after
   * support changes the sampling target.
   */
  finalReestimations: number;

  /**
   * Whether the final refit stabilized and the essential projection retained
   * the same support.
   */
  finalRefinementConverged: boolean;

  /**
   * Completed fixed-subset optimizer reports from the final refinement, or an
   * empty list if unavailable.
   */
  optimizerFits: IAutoMovieRecoveryCameraOptimizerFit[];

  /**
   * Eighth-to-largest singular value ratio on the entire final inlier design,
   * or null when that design is unresolved.
   */
  finalDesignSingularRatio: number | null;

  /**
   * Number of tentative pairs classified within the selected epipolar
   * threshold.
   */
  inliers: number;

  /** Epipolar inlier count divided by all tentative matches. */
  inlierFraction: number;

  /**
   * Median inlier two-sided mean point-to-line distance in pixels, or null
   * without a finite statistic.
   */
  medianSymmetricPointLinePx: number | null;

  /**
   * Interpolated 90th percentile of the measured inlier point-to-line distances
   * in pixels, or null without a finite statistic.
   */
  p90SymmetricPointLinePx: number | null;

  /**
   * First- and second-image fractions covered by the inlier convex hulls in
   * their original pixel charts, or null before that stage.
   */
  inlierImageHullFractions: [number, number] | null;

  /**
   * Leading pose branch count positive in both cameras divided by the final
   * inlier count, or null before pose evaluation.
   */
  positiveDepthFraction: number | null;

  /**
   * Median measured angle in radians among the branch's finite inlier points
   * with positive depth in both cameras, or null if absent.
   */
  medianParallaxRadians: number | null;

  /**
   * Four branch counts in essential decomposition order, or an empty list
   * before branch evaluation completes.
   */
  allPositiveDepthCounts: number[];

  /**
   * Competing planar support evidence when at least four epipolar inliers
   * permit that search.
   */
  homography: IAutoMovieRecoveryCameraHomographyConsensus | null;
}
