/**
 * Explicit operating thresholds for conditional calibrated relative-pose estimation.
 *
 * @evidence contracts/common.md#principled-implementation Appearance, calibrated pixel residuals, depth, parallax and planar competition have separate numerical gates under the declared method.
 * @evidence contracts/common.md#clear-and-simple-design One complete policy travels with the input and resulting evidence without supplying expected answers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling confidence is conditional on its ideal model and cannot certify material correspondence or camera truth.
 * @evidence contracts/common.md#meaningful-documentation Members state pixel/radian units, open and closed intervals, unsigned seed and local-fit scale.
 */
export interface IAutoMovieRecoveryCameraPolicy {
  /** Multiscale Harris positions, oriented gradient descriptors and calibrated eight-point consensus. */
  family: "harris-gradient-calibrated-eight-point";

  /** Positive harmonic Harris response threshold in squared grayscale-byte units. */
  minimumCornerResponse: number;

  /** ANMS stronger-neighbour robustness strictly between zero and one. */
  suppressionRobustness: number;

  /** Strict Euclidean nearest/second-distinct-feature distance ratio in (0,1). */
  descriptorDistanceRatio: number;

  /** Positive pixel Sampson threshold used to score calibrated consensus. */
  maximumSampsonErrorPx: number;

  /** Conditional sampling confidence in (0,1), not probability that a returned pose is physically correct. */
  samplingConfidence: number;

  /** Unsigned 32-bit deterministic sampling identity, independent of fixture or invocation order. */
  samplingSeed: number;

  /** Positive minimum unique accepted correspondence count, at least eight. */
  minimumInliers: number;

  /** Minimum inliers divided by all tentative matches, in (0,1]. */
  minimumInlierFraction: number;

  /** Positive median symmetric point-to-epipolar-line error limit in pixels. */
  maximumMedianErrorPx: number;

  /** Positive 90th-percentile symmetric point-to-line error limit in pixels. */
  maximumP90ErrorPx: number;

  /** Minimum triangulated points in front of both cameras, in (0,1]. */
  minimumPositiveDepthFraction: number;

  /** Positive median calibrated ray parallax in radians; metric scale remains unknown. */
  minimumParallaxRadians: number;

  /** Homography overlap at or above this fraction of epipolar inliers rejects the nonplanar route, in (0,1]. */
  maximumHomographyOverlapFraction: number;

  /** Positive symmetric forward/backward RMS homography transfer threshold in pixels. */
  maximumHomographyTransferPx: number;

  /** Positive minimum eighth/largest singular-value ratio of the original eight-point design. */
  minimumDesignSingularRatio: number;

  /** Positive pixel scale of the soft-L1 local Sampson objective. */
  refinementLossScalePx: number;
}
