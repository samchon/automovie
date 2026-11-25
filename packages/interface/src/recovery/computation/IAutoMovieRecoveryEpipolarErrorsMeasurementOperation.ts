/**
 * Measure signed Sampson distance and mean two-sided point-to-line distance in
 * the supplied integer-pixel-centre charts. Undefined lines or nonfinite
 * residuals remain null observations and cannot be counted as inliers. Invalid
 * matrices or nonrepresentable matrix-vector actions throw in the algebra
 * owner. Sampson distance is a local approximation, not reprojection truth.
 */

export namespace IAutoMovieRecoveryEpipolarErrorsMeasurementOperation {
  /**
   * Measure signed Sampson distance and mean two-sided point-to-line distance
   * in the supplied integer-pixel-centre charts. Undefined lines or nonfinite
   * residuals remain null observations and cannot be counted as inliers.
   * Invalid matrices or nonrepresentable matrix-vector actions throw in the
   * algebra owner. Sampson distance is a local approximation, not reprojection
   * truth.
   */

  export type Operation = (
    matrix: readonly number[],
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
  ) => ({
    /**
     * Signed first-order epipolar residual in pixels; this is a numerical
     * Sampson approximation.
     */
    signedSampsonPx: number;
    /** Symmetric point-to-epipolar-line discrepancy in pixels. */
    symmetricPointLinePx: number;
  } | null)[];
}
