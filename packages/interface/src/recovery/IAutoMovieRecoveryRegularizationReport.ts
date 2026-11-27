import type { IAutoMovieRecoveryRegularizationUpdate } from "..";

/** Fit-local accepted-step metric reactions without a trajectory or rate claim. */
export interface IAutoMovieRecoveryRegularizationReport {
  /** Each joint fit, including a new closure population, starts at 1e-3. */
  initialDamping: number;

  /** Coefficient used by the last existing model, including its terminal check. */
  finalDamping: number;

  /** Supported rule applications after selections; a factor of one still counts. */
  supportedUpdates: number;

  /**
   * Selected increments whose computed decrease, ratio or next coefficient was
   * unsupported.
   */
  unsupportedUpdates: number;

  /**
   * Latest selected-increment reaction, or null when no local update was
   * selected.
   */
  lastUpdate: IAutoMovieRecoveryRegularizationUpdate | null;
}
