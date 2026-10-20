/**
 * Requested tessellation tolerance and finite output budgets for an elliptic loft.
 *
 * @evidence contracts/common.md#principled-implementation A model-space chord tolerance and cell and vertex limits bound the requested elliptic-loft realization.
 * @evidence contracts/common.md#clear-and-simple-design Physical approximation tolerance is separate from finite output-population budgets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested tolerance does not certify image fit, unseen caps or an arbitrary mesh size.
 * @evidence contracts/common.md#meaningful-documentation States metre tolerance and the cell and vertex count limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryImageLoftBudget {
  /** Requested tessellation tolerance, metres. */
  tolerance: number;

  /** Maximum permitted tessellation cells. */
  maxCells: number;

  /** Maximum permitted generated vertices. */
  maxVertices: number;
}
