/** Finite patch and realization budgets for one local cubic-boundary chart. */

export interface IAutoMovieRecoveryEventCompilationPolicy {
  /** Positive integer maximum bicubic patches. */
  maxPatches: number;

  /** Positive integer maximum realization cells. */
  maxCells: number;

  /** Positive integer maximum realization vertices. */
  maxVertices: number;

  /** Positive physical chord tolerance, millimetres. */
  toleranceMm: number;

  /**
   * When true, external chart endpoints are evaluated from their declared
   * native parents.
   */
  nativeParentBindings?: boolean;
}
