/** One computed actual-to-model reaction after a selected feasible update. */
export interface IAutoMovieRecoveryRegularizationUpdate {
  /** Finite positive decrease, ratio and next coefficient supported the rule. */
  supported: boolean;

  /** Arithmetic support status, independent of candidate qualification or KKT. */
  reason:
    | "accepted-agreement"
    | "decrease-unsupported"
    | "ratio-unsupported"
    | "damping-unsupported";

  /**
   * Positive column-scaled damping used by every candidate at the previous
   * base.
   */
  previousDamping: number;

  /** Coefficient for the next existing model; unchanged when unsupported. */
  damping: number;

  /**
   * Actual same-population robust decrease in squared pixels, or null if
   * nonfinite.
   */
  actualDecrease: number | null;

  /**
   * Undamped current weighted-GN model decrease in squared pixels, or null if
   * nonfinite.
   */
  predictedDecrease: number | null;

  /** Positive finite computed actual/predicted ratio; null without that support. */
  ratio: number | null;

  /** Accepted-radius reciprocal multiplier; null before a supported ratio. */
  factor: number | null;
}
