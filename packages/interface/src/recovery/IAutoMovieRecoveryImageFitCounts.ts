/**
 * Counts for the selected cubic spline fit. Counts describe the coefficient
 * solve and common row domain used to produce the recipe.
 */
export interface IAutoMovieRecoveryImageFitCounts {
  /**
   * Number of distinct physical Y stations used by the fit within the common
   * domain of the views.
   */
  rows: number;

  /** Number of longitudinal cubic spans in the selected profile. */
  spans: number;

  /**
   * Total independent scalar coefficients across all fitted fields before
   * conversion to saved span controls.
   */
  freeScalars: number;
}
