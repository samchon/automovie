/**
 * Physical display tessellation limits for an observed coefficient atlas.
 *
 * @evidence contracts/development/design.md#principled-representation A millimetre tolerance and finite cell/vertex budgets retain the existing tessellation policy independently of source observation and fitting limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named record owns the existing atlas tessellation options without changing their values or admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The explicit unresolved-cell policy does not claim a surface-error guarantee for a retained coarse cell.
 * @evidence contracts/development/common.md#meaningful-documentation States physical tolerance, count budgets and optional unresolved-cell choices.
 */
export interface IAutoMovieRecoveryAtlasTessellation {
  /** Physical tessellation tolerance, millimetres. */
  toleranceMm: number;

  /** Maximum tessellation cell population. */
  maxCells: number;

  /** Maximum emitted vertex population. */
  maxVertices: number;

  /** Explicit handling of cells unresolved within budget; omission delegates to the existing tessellator policy. */
  cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";
}
