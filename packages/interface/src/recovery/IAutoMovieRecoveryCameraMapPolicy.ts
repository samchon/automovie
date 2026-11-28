/**
 * Thresholds for an ordered camera triad's point geometry, resection consensus,
 * and joint fit. Pixel residuals use Euclidean distance from the calibrated
 * projected point to the observed image location.
 */
export interface IAutoMovieRecoveryCameraMapPolicy {
  /**
   * Positive finite limit on Euclidean reprojection error for each observing
   * image, in pixels.
   */
  maximumReprojectionErrorPx: number;

  /**
   * Finite minimum acute seed-viewing-ray angle in degrees, strictly between
   * zero and 90. It gates triangulated and jointly fitted seed points.
   */
  minimumPointParallaxDegrees: number;

  /**
   * Safe integer minimum of six or more distinct 3D-track and target-feature
   * inliers.
   */
  minimumResectionInliers: number;

  /**
   * Required resection inlier fraction over all eligible distinct 3D-to-2D
   * observations, in (0, 1].
   */
  minimumResectionInlierFraction: number;

  /** Conditional confidence in (0, 1) for the ideal six-point proposal model. */
  samplingConfidence: number;

  /** Deterministic unsigned 32-bit sampling seed, including zero. */
  samplingSeed: number;

  /**
   * Finite lower bound in (0, 1) for original-design singular-value ratios used
   * to qualify point and camera observability.
   */
  minimumDesignSingularRatio: number;

  /**
   * Finite upper bound in [0, 1) on the smallest-to-next-smallest singular
   * value ratio in the direct linear transform.
   */
  maximumDltNullRatio: number;

  /**
   * Finite relative Frobenius error bound in (0, 1) between the recovered
   * direct-linear rotation block and its proper scaled rotation.
   */
  maximumRotationProjectionError: number;

  /**
   * Positive finite soft-L1 scale in pixels, applied to the norm of each
   * two-coordinate residual.
   */
  lossScalePx: number;
}
