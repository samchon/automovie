/** Bounded actual-trial attribution, independent of direction certification. */
export interface IAutoMovieRecoveryFeasibleTrials {
  /** Original tilted full trials and subsequent baseline halving evaluations. */
  baseline: number;

  /** Full comparisons using the nominal physical-norm mixture. */
  nominal: number;

  /** Full comparisons using the original-row numerical-support mixture. */
  numerical: number;

  /** Full comparisons using a same-base correction arc. */
  corrected: number;

  /**
   * Actual half comparisons on qualified accelerated paths with fixed
   * correction.
   */
  half: number;

  /**
   * Complete actual qualification passed but a lower-cost or earlier equal
   * candidate was selected.
   */
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
