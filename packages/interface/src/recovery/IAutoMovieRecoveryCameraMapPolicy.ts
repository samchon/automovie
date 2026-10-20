/**
 * Independent pixel-reprojection and point-geometry qualifications for a triad.
 * These residuals are Euclidean image distances, not epipolar Sampson errors.
 *
 * @evidence contracts/common.md#principled-implementation Separate point, resection and joint-fit quantities express conditional calibrated geometry without equating different residuals or estimating covariance.
 * @evidence contracts/common.md#clear-and-simple-design One explicit policy accompanies the three-view map; unchanged seed observation and epipolar policy remain independently named.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected pose, physical scale, hidden default or per-image exception supplies a camera.
 * @evidence contracts/common.md#meaningful-documentation Every member gives its units, supported range and qualification population.
 */
export interface IAutoMovieRecoveryCameraMapPolicy {
  /** Positive maximum Euclidean reprojection distance in each observing image, in pixels. */
  maximumReprojectionErrorPx: number;

  /** Pointwise acute ray angle in degrees, strictly between 0 and 90, for seed triangulation. */
  minimumPointParallaxDegrees: number;

  /** Minimum distinct 3D-track/target-feature resection inliers, integer at least six. */
  minimumResectionInliers: number;

  /** Resection inlier fraction over all eligible distinct 3D-to-2D observations, in (0,1]. */
  minimumResectionInlierFraction: number;

  /** Ideal unique-six-sample stopping confidence in (0,1), not physical correspondence confidence. */
  samplingConfidence: number;

  /** Deterministic unsigned 32-bit sampling identity. */
  samplingSeed: number;

  /** Positive original-design singular-value ratio below one for DLT, point and local camera observability. */
  minimumDesignSingularRatio: number;

  /** Maximum smallest/next-smallest DLT singular-value ratio in [0,1), identifying a resolved projective direction. */
  maximumDltNullRatio: number;

  /** Maximum relative Frobenius discrepancy between recovered DLT rotation block and its proper scaled rotation, in (0,1). */
  maximumRotationProjectionError: number;

  /** Positive soft-L1 scale in pixels, applied to each complete 2D residual norm. */
  lossScalePx: number;
}
