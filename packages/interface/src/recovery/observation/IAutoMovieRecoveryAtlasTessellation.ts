/** Physical display tessellation limits for an observed coefficient atlas. */
export interface IAutoMovieRecoveryAtlasTessellation {
  /** Physical tessellation tolerance, millimetres. */
  toleranceMm: number;

  /** Maximum tessellation cell population. */
  maxCells: number;

  /** Maximum emitted vertex population. */
  maxVertices: number;

  /**
   * Explicit handling of cells unresolved within budget; omission delegates to
   * the existing tessellator policy.
   */
  cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";
}
