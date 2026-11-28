import type { IAutoMovieRecoverySupportLoftBudget } from "..";

/**
 * Bound finite-view convex-support fitting from supplied orthographic
 * silhouette rows. Recovery checks fitted offsets and realized section supports
 * at common stations before qualifying the recipe under the generation limits.
 */

export interface IAutoMovieRecoverySupportFitPolicy {
  /**
   * Select one convex section hull defined by the fixed view directions at each
   * Y.
   */
  family: "finite-view-convex-support";

  /**
   * Positive safe integer cap on supplied views. The fitter requires at least
   * three views.
   */
  maxViews: number;

  /**
   * Positive safe integer cap on the total admitted observation rows across all
   * views.
   */
  maxRows: number;

  /**
   * Positive safe integer cap on candidate cubic spans. A candidate with N
   * spans needs at least N + 3 common stations.
   */
  maxSpans: number;

  /**
   * Positive finite pixel limit on both fitted offset error and the implied
   * convex section's support error in both oriented directions of every view.
   */
  maximumResidualPx: number;

  /**
   * Finite threshold strictly between zero and one for the smallest-to-largest
   * magnitude of the spline QR diagonal.
   */
  minimumSplineRatio: number;

  /**
   * Engine limits for the candidate's support planes, boundary events, cell and
   * vertex counts, and model-space chord tolerance.
   */
  generation: IAutoMovieRecoverySupportLoftBudget;
}
