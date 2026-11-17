import type { IAutoMovieRecoverySupportLoftBudget } from "../../index";

/**
 * Limits and acceptance thresholds for finite-view convex-support fitting.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declared section family; hidden concavities remain unobserved. Positive integer upper bound on supplied image views.
 * @evidence contracts/development/design.md#principled-representation Positive integer upper bound on supplied image views.
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageSupportLoft share IAutoMovieRecoverySupportFitPolicy's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent finite limits for continuous boundary planning and generated geometry.
 */

export interface IAutoMovieRecoverySupportFitPolicy {
  /** Declared section family; hidden concavities remain unobserved. */
  family: "finite-view-convex-support";

  /** Positive integer upper bound on supplied image views. */
  maxViews: number;

  /** Positive integer upper bound on retained observed rows. */
  maxRows: number;

  /** Positive integer upper bound on longitudinal cubic spans tried. */
  maxSpans: number;

  /** Positive maximum residual for fitted offsets and their implied hull supports, pixels. */
  maximumResidualPx: number;

  /** Minimum spline QR diagonal ratio, strictly between zero and one. */
  minimumSplineRatio: number;

  /** Independent finite limits for continuous boundary planning and generated geometry. */
  generation: IAutoMovieRecoverySupportLoftBudget;
}
