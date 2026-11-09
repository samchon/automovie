/**
 * Owned calibrated pixels, positive depth and complete local derivatives.
 *
 * @evidence contracts/development/design.md#principled-representation Pixel coordinates use the calibrated pinhole chart, camera derivatives use left rotation of RX and independent translation, and point derivatives use world coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One projection supplies all values consumed by fitting and qualification without retaining the input pose, point or intrinsic matrix.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite pixels alone do not certify finite derivatives; the producer checks every returned component without depth clamps or substitute zeros.
 * @evidence contracts/development/common.md#meaningful-documentation Fields state pixel units, positive camera depth, six camera columns and three world-point columns.
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
