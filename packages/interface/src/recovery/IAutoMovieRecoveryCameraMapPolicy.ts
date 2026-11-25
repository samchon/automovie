/**
 * Independent pixel-reprojection and point-geometry qualifications for a triad.
 * These residuals are Euclidean image distances, not epipolar Sampson errors.
 */
export interface IAutoMovieRecoveryCameraMapPolicy {
  /**
   * Positive maximum Euclidean reprojection distance in each observing image,
   * in pixels.
   */
  maximumReprojectionErrorPx: number;

  /**
   * Pointwise acute ray angle in degrees, strictly between 0 and 90, for seed
   * triangulation.
   */
  minimumPointParallaxDegrees: number;

  /**
   * Minimum distinct 3D-track/target-feature resection inliers, integer at
   * least six.
   */
  minimumResectionInliers: number;

  /**
   * Resection inlier fraction over all eligible distinct 3D-to-2D observations,
   * in (0,1].
   */
  minimumResectionInlierFraction: number;

  /**
   * Ideal unique-six-sample stopping confidence in (0,1), not physical
   * correspondence confidence.
   */
  samplingConfidence: number;

  /** Deterministic unsigned 32-bit sampling identity. */
  samplingSeed: number;

  /**
   * Positive original-design singular-value ratio below one for DLT, point and
   * local camera observability.
   */
  minimumDesignSingularRatio: number;

  /**
   * Maximum smallest/next-smallest DLT singular-value ratio in [0,1),
   * identifying a resolved projective direction.
   */
  maximumDltNullRatio: number;

  /**
   * Maximum relative Frobenius discrepancy between recovered DLT rotation block
   * and its proper scaled rotation, in (0,1).
   */
  maximumRotationProjectionError: number;

  /**
   * Positive soft-L1 scale in pixels, applied to each complete 2D residual
   * norm.
   */
  lossScalePx: number;
}
