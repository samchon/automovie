/**
 * Explicit feature, robust consensus and relative-pose thresholds for an
 * ordered calibrated camera pair. Residual thresholds use the original pixel
 * charts.
 */
export interface IAutoMovieRecoveryCameraPolicy {
  /**
   * Select multiscale Harris detection, oriented gradient matching and
   * calibrated eight-point consensus.
   */
  family: "harris-gradient-calibrated-eight-point";

  /**
   * Positive harmonic Harris response threshold, in squared grayscale-byte
   * units.
   */
  minimumCornerResponse: number;

  /** Adaptive spatial suppression's stronger-neighbour factor in (0, 1). */
  suppressionRobustness: number;

  /**
   * Strict nearest-to-second-nearest Euclidean descriptor distance ratio in (0,
   * 1).
   */
  descriptorDistanceRatio: number;

  /** Positive absolute signed-Sampson inlier threshold in pixels. */
  maximumSampsonErrorPx: number;

  /** Conditional all-inlier sampling target in (0, 1). */
  samplingConfidence: number;

  /** Deterministic unsigned 32-bit sampling seed, including zero. */
  samplingSeed: number;

  /** Safe integer minimum accepted epipolar support, at least eight. */
  minimumInliers: number;

  /** Minimum final inlier fraction over all tentative matches, in (0, 1]. */
  minimumInlierFraction: number;

  /** Positive upper bound on median symmetric point-to-line error in pixels. */
  maximumMedianErrorPx: number;

  /**
   * Positive upper bound on the 90th percentile symmetric point-to-line error
   * in pixels.
   */
  maximumP90ErrorPx: number;

  /** Minimum fraction of final inliers positive in both cameras, in (0, 1]. */
  minimumPositiveDepthFraction: number;

  /** Positive median calibrated-ray parallax threshold, in radians. */
  minimumParallaxRadians: number;

  /**
   * Fraction of final epipolar inliers at or above which planar overlap refuses
   * the nonplanar route, in (0, 1].
   */
  maximumHomographyOverlapFraction: number;

  /**
   * Positive symmetric forward/backward RMS homography transfer threshold in
   * pixels.
   */
  maximumHomographyTransferPx: number;

  /**
   * Positive dimensionless lower bound for the relevant original-design
   * singular ratio.
   */
  minimumDesignSingularRatio: number;

  /**
   * Positive soft-L1 scale in pixels for the fixed-subset signed Sampson
   * objective.
   */
  refinementLossScalePx: number;
}
