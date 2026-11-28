/**
 * Atlas tessellation controls supplied with an elliptic image recipe. The
 * compiler admits the tolerance and both counts before storing them for later
 * realization.
 */
export interface IAutoMovieRecoveryImageLoftBudget {
  /** Positive finite atlas-to-triangle tolerance in metres. */
  tolerance: number;

  /** Positive safe integer cap on tessellation cells for atlas realization. */
  maxCells: number;

  /**
   * Safe integer cap of at least three generated vertices for atlas
   * realization.
   */
  maxVertices: number;
}
