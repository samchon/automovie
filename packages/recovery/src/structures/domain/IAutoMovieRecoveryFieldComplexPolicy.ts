import type { IAutoMovieRecoveryEventCompilationPolicy } from "./IAutoMovieRecoveryEventCompilationPolicy";

/**
 * Local chart budgets and aggregate field-complex admission limits.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryFieldComplexPolicy extends IAutoMovieRecoveryEventCompilationPolicy {
  /** Positive safe-integer limit on admitted chart declarations. */
  maxCharts: number;

  /** Positive safe-integer limit on native coefficient owners. */
  maxNativeOwners: number;

  /** Positive safe-integer aggregate patch budget. */
  maxTotalPatches: number;
}
