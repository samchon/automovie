/**
 * Physical display tessellation limits for an observed coefficient atlas.
 *
 * @evidence contracts/common.md#principled-implementation A millimetre tolerance and finite cell/vertex budgets retain the existing tessellation policy independently of source observation and fitting limits.
 * @evidence contracts/common.md#clear-and-simple-design One named record owns the existing atlas tessellation options without changing their values or admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit unresolved-cell policy does not claim a surface-error guarantee for a retained coarse cell.
 * @evidence contracts/common.md#meaningful-documentation States physical tolerance, count budgets and optional unresolved-cell choices.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased policy performs no tessellation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing observation input owns this policy record.
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
