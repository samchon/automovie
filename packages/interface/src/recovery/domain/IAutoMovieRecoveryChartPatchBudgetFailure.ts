/**
 * Explicit chart compilation refusal when the local knot partition exceeds its patch budget.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Discriminates a refused chart compilation. The local tensor partition exceeds maxPatches.
 * @evidence contracts/development/design.md#principled-representation Explicit chart compilation refusal when the local knot partition exceeds its patch budget.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assembleAutoMovieRecoveryFieldComplex, compileAutoMovieRecoveryEventDomain, compileAutoMovieRecoveryNativeNamedChart share IAutoMovieRecoveryChartPatchBudgetFailure's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Discriminates a refused chart compilation.
 */

export interface IAutoMovieRecoveryChartPatchBudgetFailure {
  /** Discriminates a refused chart compilation. */
  complete: false;

  /** The local tensor partition exceeds maxPatches. */
  reason: "chart-patch-budget";

  /** Product of the actual local U and V interval counts. */
  requiredPatches: number;
}
