/**
 * Owned calibrated pixels, positive depth and complete local derivatives.
 *
 * @evidence contracts/common.md#principled-implementation Pixel coordinates use the calibrated pinhole chart, camera derivatives use left rotation of RX and independent translation, and point derivatives use world coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One projection supplies all values consumed by fitting and qualification without retaining the input pose, point or intrinsic matrix.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite pixels alone do not certify finite derivatives; the producer checks every returned component without depth clamps or substitute zeros.
 * @evidence contracts/common.md#meaningful-documentation Fields state pixel units, positive camera depth, six camera columns and three world-point columns.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no projection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A pixel tuple and two independent two-row derivative arrays transfer to the caller; no borrowed geometry, history or handle is retained.
 */
export interface IAutoMovieRecoveryMapProjection {
  /** Calibrated two-coordinate pixel in the supplied intrinsic chart. */
  pixel: [number, number];

  /** Strictly positive finite camera-frame Z coordinate. */
  depth: number;

  /** Two owned rows ordered as three left-rotation then three translation columns. */
  cameraJacobian: number[][];

  /** Two owned rows of three world-point derivative columns. */
  pointJacobian: number[][];
}
