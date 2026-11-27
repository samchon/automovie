/**
 * Observed and fitted scalar populations, without a geometric coverage
 * assertion.
 */
export interface IAutoMovieRecoveryImageFitCounts {
  /** Number of corresponding observed physical rows. */
  rows: number;

  /** Number of longitudinal spline spans. */
  spans: number;

  /** Number of independently fitted scalar coefficients. */
  freeScalars: number;
}
