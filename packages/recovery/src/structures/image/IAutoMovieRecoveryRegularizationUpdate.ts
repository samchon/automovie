/**
 * One computed actual-to-model reaction after a selected feasible update.
 *
 * @evidence contracts/common.md#principled-implementation A positive finite undamped model decrease and actual robust decrease define the computed agreement ratio; it is not an exact ratio or nonlinear convergence certificate.
 * @evidence contracts/common.md#clear-and-simple-design The scalar result distinguishes a supported next-model coefficient from arithmetic support refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported arithmetic retains the previous positive damping without a floor, success fallback or extra model.
 * @evidence contracts/common.md#meaningful-documentation Members separate the previous and next coefficients, computed decrease units and finite-or-null diagnostics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no update.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only plain scalars transfer without numerical arrays or handles.
 */
export interface IAutoMovieRecoveryRegularizationUpdate {
  /** Finite positive decrease, ratio and next coefficient supported the rule. */
  supported: boolean;

  /** Arithmetic support status, independent of candidate qualification or KKT. */
  reason: "accepted-agreement" | "decrease-unsupported" | "ratio-unsupported" | "damping-unsupported";

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
