import type { IAutoMovieRecoverySupportLoftBudget } from "../../index";

/** Limits and acceptance thresholds for finite-view convex-support fitting. */

export interface IAutoMovieRecoverySupportFitPolicy {
  /** Declared section family; hidden concavities remain unobserved. */
  family: "finite-view-convex-support";

  /** Positive integer upper bound on supplied image views. */
  maxViews: number;

  /** Positive integer upper bound on retained observed rows. */
  maxRows: number;

  /** Positive integer upper bound on longitudinal cubic spans tried. */
  maxSpans: number;

  /**
   * Positive maximum residual for fitted offsets and their implied hull
   * supports, pixels.
   */
  maximumResidualPx: number;

  /** Minimum spline QR diagonal ratio, strictly between zero and one. */
  minimumSplineRatio: number;

  /**
   * Independent finite limits for continuous boundary planning and generated
   * geometry.
   */
  generation: IAutoMovieRecoverySupportLoftBudget;
}
