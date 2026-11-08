/**
 * Limits and acceptance thresholds for supplied-camera aligned-ellipse fitting.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
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
