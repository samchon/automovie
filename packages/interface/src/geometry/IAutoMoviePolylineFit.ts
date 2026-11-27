import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Fitted cubic coefficients with finite-observation residuals and error
 * accounting. RecoveryBezierFit.fit constructs this owned result after
 * numerical admission. Adaptive joins share tangent direction (G1), while
 * independently retained physical span widths do not imply matching derivative
 * magnitude (C1).
 */
export interface IAutoMoviePolylineFit {
  /** Fitted millimetre coefficients with their original physical phase widths. */
  curve: IAutoMovieCubicBezierCurve64;

  /** Largest observed point-to-corresponding-parameter residual, millimetres. */
  sampleMaximumMm: number;

  /** Bernstein convex-hull upper estimate over the input polyline, millimetres. */
  polylineUpperEstimateMm: number;

  /**
   * False when an unsplittable two-observation tangent-constrained span still
   * exceeds the requested tolerance.
   */
  toleranceMet: boolean;

  /** Observation count divided by emitted span count; dimensionless. */
  observationsPerSpan: number;

  /** Number of solves using the declared conditioning or handle-sign fallback. */
  handleFallbacks: number;
}
