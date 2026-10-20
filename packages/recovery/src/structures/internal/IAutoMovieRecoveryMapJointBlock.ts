/**
 * Weighted original rows for one landmark and the common camera tangent.
 *
 * @evidence contracts/common.md#principled-implementation Each complete observation contributes two rows of the same weighted pixel residual and its world-point/camera derivatives before elimination.
 * @evidence contracts/common.md#clear-and-simple-design A named block is shared by actual linearization, original-rank checks, QR elimination and numerical tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rows retain every observation; weighting changes the robust local objective but never the unweighted hard gate.
 * @evidence contracts/common.md#meaningful-documentation Members define row correspondence, physical tangent coordinates and minus-residual sign.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no numerical operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The current model owns k*(C+4) row scalars, bounded by the joint owner and released with its factors.
 */
export interface IAutoMovieRecoveryMapJointBlock {
  /** Three weighted world-point derivative columns per pixel coordinate. */
  pointRows: number[][];

  /** C gauge-fixed weighted camera derivative columns in the same row order. */
  cameraRows: number[][];

  /** Minus weighted residual for every row, in pixels. */
  right: number[];
}
