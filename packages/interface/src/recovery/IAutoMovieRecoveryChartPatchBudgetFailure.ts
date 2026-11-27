/**
 * Explicit chart compilation refusal when the local knot partition exceeds its
 * patch budget.
 */

export interface IAutoMovieRecoveryChartPatchBudgetFailure {
  /** Discriminates a refused chart compilation. */
  complete: false;

  /** The local tensor partition exceeds maxPatches. */
  reason: "chart-patch-budget";

  /** Product of the actual local U and V interval counts. */
  requiredPatches: number;
}
