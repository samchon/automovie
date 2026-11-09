/**
 * Owned scaled arrowhead curvature storage for one optional factor attempt.
 *
 * @evidence contracts/development/design.md#principled-representation Observation-local fixed-multiplier terms have no cross-landmark entries. One authoritative upper camera/point triangle and point-camera blocks represent D^-1 H_lambda D^-1+delta I.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Formation transfers these buffers to in-place point-first Cholesky; no full all-point Hessian or duplicate inverse is retained.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Symmetry is supplied by one authoritative triangle, without averaging, clipping, positive-pivot rescue or replacing independent data rank.
 * @evidence contracts/development/common.md#meaningful-documentation Camera coordinates precede three per landmark physically; factor elimination orders points first. Point rows concatenate the three point columns and the camera cross tail.
 */
export interface IAutoMovieRecoveryMapCurvatureBlocks {
  /** Upper camera Hessian, overwritten by its Schur upper factor. */
  camera: number[][];

  /** Per-point three rows: upper3x3 followed by the3xC point-camera cross block. */
  points: number[][][];
}
