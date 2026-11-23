/**
 * Explicit population limits for synchronous image observation. These are
 * caller-supplied counts, not physical dimensions or image resampling
 * settings.
 */
export interface IAutoMovieRecoveryImageBudget {
  /** Maximum total width times height across all views; positive safe integer. */
  maxPixels: number;

  /** Maximum number of view records; positive safe integer. */
  maxViews: number;

  /** Maximum total retained foreground-support rows; positive safe integer. */
  maxRows: number;
}
