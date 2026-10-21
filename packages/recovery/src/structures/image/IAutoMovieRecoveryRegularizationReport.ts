import type { IAutoMovieRecoveryRegularizationUpdate } from "./IAutoMovieRecoveryRegularizationUpdate";

/**
 * Fit-local accepted-step metric reactions without a trajectory or rate claim.
 *
 * @evidence contracts/common.md#principled-implementation Only selected actual increments update the next existing metric; normal KKT and complete actual qualification remain separate requirements.
 * @evidence contracts/common.md#clear-and-simple-design One optional map report exposes the initial and final damping, reaction counts and latest scalar support result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A supported ratio does not imply exact model agreement, Lagrangian curvature, photographic accuracy or finite-trial convergence.
 * @evidence contracts/common.md#meaningful-documentation Counts have the current joint-fit denominator, including unchanged supported coefficients and explicit unsupported reactions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased report performs no model work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fixed scalar metadata owns no history, factor, callback or external resource.
 */
export interface IAutoMovieRecoveryRegularizationReport {
  /** Each joint fit, including a new closure population, starts at 1e-3. */
  initialDamping: number;

  /** Coefficient used by the last existing model, including its terminal check. */
  finalDamping: number;

  /** Supported rule applications after selections; a factor of one still counts. */
  supportedUpdates: number;

  /** Selected increments whose computed decrease, ratio or next coefficient was unsupported. */
  unsupportedUpdates: number;

  /** Latest selected-increment reaction, or null when no local update was selected. */
  lastUpdate: IAutoMovieRecoveryRegularizationUpdate | null;
}
