import type { IAutoMovieCubicBezierCurve64 } from "./curve/IAutoMovieCubicBezierCurve64";

/** Fitted cubic coefficients with finite-observation residuals and error accounting.
 * RecoveryBezierFit.fit constructs this owned result after numerical admission.
 * Adaptive joins share tangent direction (G1), while independently retained
 * physical span widths do not imply matching derivative magnitude (C1).
 *
 * @evidence contracts/development/design.md#principled-representation The record preserves the complete cubic and the fitter's independent residual and polyline estimates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One public result owns coefficients and scalar fitting diagnostics without importing a private implementation namespace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Polyline estimates do not certify error against an unknown continuous source surface.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 */
export interface IAutoMoviePolylineFit {
  /** Fitted millimetre coefficients with their original physical phase widths. */
  curve: IAutoMovieCubicBezierCurve64;

  /** Largest observed point-to-corresponding-parameter residual, millimetres. */
  sampleMaximumMm: number;

  /** Bernstein convex-hull upper estimate over the input polyline, millimetres. */
  polylineUpperEstimateMm: number;

  /** False when an unsplittable two-observation tangent-constrained span still exceeds the requested tolerance. */
  toleranceMet: boolean;

  /** Observation count divided by emitted span count; dimensionless. */
  observationsPerSpan: number;

  /** Number of solves using the declared conditioning or handle-sign fallback. */
  handleFallbacks: number;
}
