/**
 * Conditional accepted relative camera in the first-camera unit-baseline gauge.
 *
 * @evidence contracts/development/design.md#principled-representation Row-major R and unit t map X2=R*X1+t; physical length scale and camera covariance remain unknown.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Members state axis convention, mapping direction, unknown scale and the numerical meaning of essential projection discrepancy.
 */
export interface IAutoMovieRecoveryCameraRelativePose {
  /** First source is identity, looking along+Z with image+X right and+Y down. */
  gauge: "first-camera-unit-baseline";

  /** Physical length scale is unobserved. */
  metricScale: "unknown";

  /** Row-major proper rotation mapping first-camera coordinates into the second camera. */
  rotation: number[];

  /** Unit translation in second-camera coordinates in X2=R*X1+t. */
  translation: [number, number, number];

  /** Relative Frobenius discrepancy when the final calibrated model is equalized in essential space; numerical consistency, not covariance or truth error. */
  essentialProjectionDiscrepancy: number;
}
