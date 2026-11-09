/**
 * Observed and fitted scalar populations, without a geometric coverage assertion.
 *
 * @evidence contracts/development/design.md#principled-representation Observed rows, longitudinal spans and free scalar coefficients record distinct populations used by the selected fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Counts describe fit size without duplicating its observations or saved coefficients.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither row count nor coefficient count proves physical coverage, accuracy or independent subject diversity.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes row observations, spline span count and independently fitted scalar count.
 */
export interface IAutoMovieRecoveryImageFitCounts {
  /** Number of corresponding observed physical rows. */
  rows: number;

  /** Number of longitudinal spline spans. */
  spans: number;

  /** Number of independently fitted scalar coefficients. */
  freeScalars: number;
}
