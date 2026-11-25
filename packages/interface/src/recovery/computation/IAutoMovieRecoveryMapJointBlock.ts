/** Weighted original rows for one landmark and the common camera tangent. */
export interface IAutoMovieRecoveryMapJointBlock {
  /** Three weighted world-point derivative columns per pixel coordinate. */
  pointRows: number[][];

  /** C gauge-fixed weighted camera derivative columns in the same row order. */
  cameraRows: number[][];

  /** Minus weighted residual for every row, in pixels. */
  right: number[];
}
