/**
 * Bound one resident silhouette observation with positive safe integer
 * counts. Pixel and view admission precede raster scans. The row limit counts
 * occupied support rows as they are measured.
 */
export interface IAutoMovieRecoveryImageBudget {
  /** Maximum total raster area across all views, counted in pixels. */
  maxPixels: number;

  /** Maximum number of supplied view records. */
  maxViews: number;

  /**
   * Maximum total number of retained foreground-support rows across the views.
   */
  maxRows: number;
}
