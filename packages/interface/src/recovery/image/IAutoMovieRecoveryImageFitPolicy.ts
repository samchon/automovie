/**
 * Limits and acceptance thresholds for supplied-camera aligned-ellipse fitting.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declared section family; this hypothesis does not identify hidden surfaces. Positive integer upper bound on supplied image views.
 * @evidence contracts/development/design.md#principled-representation Positive integer upper bound on supplied image views.
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft share IAutoMovieRecoveryImageFitPolicy's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Declared section family; this hypothesis does not identify hidden surfaces.
 */

export interface IAutoMovieRecoveryImageFitPolicy {
  /** Declared section family; this hypothesis does not identify hidden surfaces. */
  family: "aligned-elliptical-sections";

  /** Positive integer upper bound on supplied image views. */
  maxViews: number;

  /** Positive integer upper bound on retained observed rows. */
  maxRows: number;

  /** Positive integer upper bound on longitudinal cubic spans tried. */
  maxSpans: number;

  /** Positive maximum absolute support residual in each original pixel chart. */
  maximumResidualPx: number;

  /** Minimum two-column camera-design singular-value ratio, strictly between zero and one. */
  minimumDirectionRatio: number;

  /** Minimum spline QR diagonal ratio, strictly between zero and one. */
  minimumSplineRatio: number;
}
