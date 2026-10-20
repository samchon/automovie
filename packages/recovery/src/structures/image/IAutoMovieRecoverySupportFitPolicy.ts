import type { IAutoMovieRecoverySupportLoftBudget } from "./IAutoMovieRecoverySupportLoftBudget";

/**
 * Limits and acceptance thresholds for finite-view convex-support fitting.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
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
