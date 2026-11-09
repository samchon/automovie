/**
 * Explicit chart compilation refusal when the local knot partition exceeds its patch budget.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 */
export interface IAutoMovieRecoveryChartPatchBudgetFailure {
  /** Discriminates a refused chart compilation. */
  complete: false;

  /** The local tensor partition exceeds maxPatches. */
  reason: "chart-patch-budget";

  /** Product of the actual local U and V interval counts. */
  requiredPatches: number;
}
