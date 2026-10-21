/**
 * Owned scaled arrowhead curvature storage for one optional factor attempt.
 *
 * @evidence contracts/common.md#principled-implementation Observation-local fixed-multiplier terms have no cross-landmark entries. One authoritative upper camera/point triangle and point-camera blocks represent D^-1 H_lambda D^-1+delta I.
 * @evidence contracts/common.md#clear-and-simple-design Formation transfers these buffers to in-place point-first Cholesky; no full all-point Hessian or duplicate inverse is retained.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Symmetry is supplied by one authoritative triangle, without averaging, clipping, positive-pivot rescue or replacing independent data rank.
 * @evidence contracts/common.md#meaningful-documentation Camera coordinates precede three per landmark physically; factor elimination orders points first. Point rows concatenate the three point columns and the camera cross tail.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no assembly.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Formation owns C^2+3L(C+3) scalars until an optional refusal releases them or a selected in-place factor captures them for this model only.
 */
export interface IAutoMovieRecoveryMapCurvatureBlocks {
  /** Upper camera Hessian, overwritten by its Schur upper factor. */
  camera: number[][];

  /** Per-point three rows: upper3x3 followed by the3xC point-camera cross block. */
  points: number[][][];
}
