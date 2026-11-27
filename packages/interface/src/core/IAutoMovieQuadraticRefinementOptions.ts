/**
 * The admission threshold and work budget of `refineQuadraticProgram`.
 *
 * The threshold is compared, unchanged, with the largest original row
 * violation, the stationarity residual and the complementarity residual, each
 * in the caller's row and objective units. Meeting it is numerical convergence
 * only; the caller still checks the geometry the variables describe.
 */
export interface IAutoMovieQuadraticRefinementOptions {
  /** Admission threshold for every residual; positive and finite. */
  tolerance: number;

  /**
   * Polishing steps allowed, dual sweeps or working solves; a non-negative safe
   * integer, where 0 returns the native solution unpolished.
   */
  maximumRefinements: number;
}
