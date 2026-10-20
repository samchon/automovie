/**
 * Conditional accepted relative camera in the first-camera unit-baseline gauge.
 *
 * @evidence contracts/common.md#principled-implementation Row-major R and unit t map X2=R*X1+t; physical length scale and camera covariance remain unknown.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/common.md#meaningful-documentation Members state axis convention, mapping direction, unknown scale and the numerical meaning of essential projection discrepancy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no computation; producing operations document their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain values belong to the caller; the declaration acquires no handle or running task.
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
