/**
 * Refused chart compilation when its local tensor partition needs more patches
 * than the configured limit.
 */

export interface IAutoMovieRecoveryChartPatchBudgetFailure {
  /** False for this local chart-compilation refusal. */
  complete: false;

  /** Discriminator for exceeding the configured chart patch budget. */
  reason: "chart-patch-budget";

  /**
   * Number of patches requested by the product of the local U and V interval
   * counts.
   */
  requiredPatches: number;
}
