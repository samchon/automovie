/**
 * Callable measurement of two pixel residuals for each paired original-image
 * observation.
 */

export namespace IAutoMovieRecoveryEpipolarErrorsMeasurementOperation {
  /**
   * Apply the row-major fundamental matrix and its transpose to the matched
   * homogeneous pixels. For each valid incidence, compute signed Sampson and
   * mean two-sided line distance in pixels. Return null in the same ordinal
   * when measurement is unavailable. Unequal observation lengths or invalid
   * matrix actions raise an error.
   */

  export type Operation = (
    matrix: readonly number[],
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
  ) => ({
    /**
     * Incidence divided by the joint epipolar normal norm, signed and expressed
     * in pixels.
     */
    signedSampsonPx: number;
    /**
     * Mean of the two absolute point-to-epipolar-line distances in the original
     * image pixels.
     */
    symmetricPointLinePx: number;
  } | null)[];
}
