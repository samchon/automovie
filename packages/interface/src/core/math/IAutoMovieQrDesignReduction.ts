/**
 * Orthogonally compressed least-squares objective in unchanged variables. For
 * every x, ||A_x-b||^2 equals ||rows_x-right||^2 plus the squared
 * orthogonalResidualNorm, to floating arithmetic accuracy. No rank is claimed.
 */
export interface IAutoMovieQrDesignReduction {
  /** N-by-n upper original design, including unresolved zero directions. */
  rows: number[][];

  /** Length-n transformed right side in the same objective's units. */
  right: number[];

  /** Nonnegative norm of the discarded x-independent orthogonal residual. */
  orthogonalResidualNorm: number;

  /**
   * Actual design/right cells transformed, at most the admitted conservative
   * bound.
   */
  transformedCells: number;
}
