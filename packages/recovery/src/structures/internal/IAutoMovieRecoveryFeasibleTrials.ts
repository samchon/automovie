/**
 * Bounded actual-trial attribution, independent of direction certification.
 *
 * @evidence contracts/development/design.md#principled-representation Each real retraction/evaluation has one path and one outcome: selected, qualified unselected, or a first rejection cause, preserving the original fixed trial ceiling and gates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Scalar counters distinguish baseline, nominal/numerical mixture, corrected full and accelerated half paths from qualified-unselected, feasibility, decrease and Armijo outcomes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A direction guard is not counted as an actual rejected trial, and missing cost is not zero cost or convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Counts include selected, qualified unselected and rejected evaluations; lastFailure records the most recent failure even after later progress. Path totals equal iterations; accepted plus qualified-unselected plus three failure totals also equal iterations.
 */
export interface IAutoMovieRecoveryFeasibleTrials {
  /** Original tilted full trials and subsequent baseline halving evaluations. */
  baseline: number;

  /** Full comparisons using the nominal physical-norm mixture. */
  nominal: number;

  /** Full comparisons using the original-row numerical-support mixture. */
  numerical: number;

  /** Full comparisons using a same-base correction arc. */
  corrected: number;

  /** Actual half comparisons on qualified accelerated paths with fixed correction. */
  half: number;

  /** Complete actual qualification passed but a lower-cost or earlier equal candidate was selected. */
  qualifiedUnselected: number;

  /** First rejection cause was null or nonfinite actual cost/qualification. */
  infeasible: number;

  /** First rejection cause was cost greater than or equal to current cost. */
  nondecreasing: number;

  /** Cost decreased but failed the unchanged Armijo condition. */
  armijo: number;

  /** Latest actual rejection cause; null before any rejected trial. */
  lastFailure: string | null;

  /** Generic trial-vector and fixed attribution visits, separately charged. */
  work: number;
}
