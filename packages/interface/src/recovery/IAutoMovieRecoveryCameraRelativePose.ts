/**
 * Qualified transform from the first camera into the second. The first camera
 * fixes the axes and the fitted translation has unit norm.
 */
export interface IAutoMovieRecoveryCameraRelativePose {
  /**
   * First-camera axes with a unit baseline. Camera X points right, Y down and Z
   * forward.
   */
  gauge: "first-camera-unit-baseline";

  /** Physical length scale remains unknown. */
  metricScale: "unknown";

  /**
   * Nine row-major coefficients of the proper rotation from first-camera axes
   * into the second camera.
   */
  rotation: number[];

  /** Unit translation in the second camera coordinates for `X2 = R × X1 + t`. */
  translation: [number, number, number];

  /**
   * Dimensionless relative Frobenius difference from replacing the calibrated
   * essential singular values with equal leading values and zero third value.
   */
  essentialProjectionDiscrepancy: number;
}
