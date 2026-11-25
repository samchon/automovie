/** One detached actual evaluation against an unchanged feasible base. */
export interface IAutoMovieRecoveryFeasibleCandidate<State> {
  /** Detached trial in the same chart and observation population as its base. */
  state: State;

  /**
   * Nullable raw same-population objective; a finite value alone does not
   * qualify this candidate.
   */
  cost: number | null;

  /** Every original gate, finite strict decrease and own Armijo test passed. */
  qualified: boolean;

  /**
   * Owned physical increment passed unchanged to this candidate's retraction,
   * including its actual arc amount and correction.
   */
  increment: number[];
}
