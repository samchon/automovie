/**
 * Limits and acceptance thresholds for supplied-camera aligned-ellipse fitting.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
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
