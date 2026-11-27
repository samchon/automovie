/**
 * Requested tessellation tolerance and finite output budgets for an elliptic
 * loft.
 */
export interface IAutoMovieRecoveryImageLoftBudget {
  /** Requested tessellation tolerance, metres. */
  tolerance: number;

  /** Maximum permitted tessellation cells. */
  maxCells: number;

  /** Maximum permitted generated vertices. */
  maxVertices: number;
}
