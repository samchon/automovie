/**
 * Observed and fitted scalar populations, without a geometric coverage assertion.
 *
 * @evidence contracts/common.md#principled-implementation Observed rows, longitudinal spans and free scalar coefficients record distinct populations used by the selected fit.
 * @evidence contracts/common.md#clear-and-simple-design Counts describe fit size without duplicating its observations or saved coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither row count nor coefficient count proves physical coverage, accuracy or independent subject diversity.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes row observations, spline span count and independently fitted scalar count.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
 */
export interface IAutoMovieRecoveryImageFitCounts {
  /** Number of corresponding observed physical rows. */
  rows: number;

  /** Number of longitudinal spline spans. */
  spans: number;

  /** Number of independently fitted scalar coefficients. */
  freeScalars: number;
}
