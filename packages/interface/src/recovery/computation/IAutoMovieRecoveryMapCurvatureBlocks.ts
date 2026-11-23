/** Owned scaled arrowhead curvature storage for one optional factor attempt. */
export interface IAutoMovieRecoveryMapCurvatureBlocks {
  /** Upper camera Hessian, overwritten by its Schur upper factor. */
  camera: number[][];

  /** Per-point three rows: upper3x3 followed by the3xC point-camera cross block. */
  points: number[][][];
}
