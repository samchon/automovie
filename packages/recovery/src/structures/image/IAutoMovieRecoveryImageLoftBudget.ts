/**
 * Requested tessellation tolerance and finite output budgets for an elliptic loft.
 *
 * @evidence contracts/development/design.md#principled-representation A model-space chord tolerance and cell and vertex limits bound the requested elliptic-loft realization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Physical approximation tolerance is separate from finite output-population budgets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A requested tolerance does not certify image fit, unseen caps or an arbitrary mesh size.
 * @evidence contracts/development/common.md#meaningful-documentation States metre tolerance and the cell and vertex count limits.
 */
export interface IAutoMovieRecoveryImageLoftBudget {
  /** Requested tessellation tolerance, metres. */
  tolerance: number;

  /** Maximum permitted tessellation cells. */
  maxCells: number;

  /** Maximum permitted generated vertices. */
  maxVertices: number;
}
