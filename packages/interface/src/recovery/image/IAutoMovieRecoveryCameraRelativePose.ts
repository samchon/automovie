/** Conditional accepted relative camera in the first-camera unit-baseline gauge. */
export interface IAutoMovieRecoveryCameraRelativePose {
  /** First source is identity, looking along+Z with image+X right and+Y down. */
  gauge: "first-camera-unit-baseline";

  /** Physical length scale is unobserved. */
  metricScale: "unknown";

  /**
   * Row-major proper rotation mapping first-camera coordinates into the second
   * camera.
   */
  rotation: number[];

  /** Unit translation in second-camera coordinates in X2=R*X1+t. */
  translation: [number, number, number];

  /**
   * Relative Frobenius discrepancy when the final calibrated model is equalized
   * in essential space; numerical consistency, not covariance or truth error.
   */
  essentialProjectionDiscrepancy: number;
}
