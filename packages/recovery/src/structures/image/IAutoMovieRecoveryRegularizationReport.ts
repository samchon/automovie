import type { IAutoMovieRecoveryRegularizationUpdate } from "./IAutoMovieRecoveryRegularizationUpdate";

/**
 * Fit-local accepted-step metric reactions without a trajectory or rate claim.
 *
 * @evidence contracts/development/design.md#principled-representation Only selected actual increments update the next existing metric; normal KKT and complete actual qualification remain separate requirements.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional map report exposes the initial and final damping, reaction counts and latest scalar support result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A supported ratio does not imply exact model agreement, Lagrangian curvature, photographic accuracy or finite-trial convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Counts have the current joint-fit denominator, including unchanged supported coefficients and explicit unsupported reactions.
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
