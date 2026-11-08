/**
 * One computed actual-to-model reaction after a selected feasible update.
 *
 * @evidence contracts/development/design.md#principled-representation A positive finite undamped model decrease and actual robust decrease define the computed agreement ratio; it is not an exact ratio or nonlinear convergence certificate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The scalar result distinguishes a supported next-model coefficient from arithmetic support refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported arithmetic retains the previous positive damping without a floor, success fallback or extra model.
 * @evidence contracts/development/common.md#meaningful-documentation Members separate the previous and next coefficients, computed decrease units and finite-or-null diagnostics.
 */
export interface IAutoMovieRecoveryRegularizationUpdate {
  /** Finite positive decrease, ratio and next coefficient supported the rule. */
  supported: boolean;

  /** Arithmetic support status, independent of candidate qualification or KKT. */
  reason:
    | "accepted-agreement"
    | "decrease-unsupported"
    | "ratio-unsupported"
    | "damping-unsupported";

  /** Positive column-scaled damping used by every candidate at the previous base. */
  previousDamping: number;

  /** Coefficient for the next existing model; unchanged when unsupported. */
  damping: number;

  /** Actual same-population robust decrease in squared pixels, or null if nonfinite. */
  actualDecrease: number | null;

  /** Undamped current weighted-GN model decrease in squared pixels, or null if nonfinite. */
  predictedDecrease: number | null;

  /** Positive finite computed actual/predicted ratio; null without that support. */
  ratio: number | null;

  /** Accepted-radius reciprocal multiplier; null before a supported ratio. */
  factor: number | null;
}
