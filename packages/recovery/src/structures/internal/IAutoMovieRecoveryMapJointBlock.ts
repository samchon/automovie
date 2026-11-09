/**
 * Weighted original rows for one landmark and the common camera tangent.
 *
 * @evidence contracts/development/design.md#principled-representation Each complete observation contributes two rows of the same weighted pixel residual and its world-point/camera derivatives before elimination.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A named block is shared by actual linearization, original-rank checks, QR elimination and numerical tests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rows retain every observation; weighting changes the robust local objective but never the unweighted hard gate.
 * @evidence contracts/development/common.md#meaningful-documentation Members define row correspondence, physical tangent coordinates and minus-residual sign.
 */
export interface IAutoMovieRecoveryMapJointBlock {
  /** Three weighted world-point derivative columns per pixel coordinate. */
  pointRows: number[][];

  /** C gauge-fixed weighted camera derivative columns in the same row order. */
  cameraRows: number[][];

  /** Minus weighted residual for every row, in pixels. */
  right: number[];
}
