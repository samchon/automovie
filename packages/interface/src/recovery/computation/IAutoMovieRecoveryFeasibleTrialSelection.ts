/** One bounded same-base selection, without a normal convergence claim. */
export interface IAutoMovieRecoveryFeasibleTrialSelection<State> {
  /** Chosen detached state, or the unchanged base when accepted is false. */
  state: State;

  /** Original cost of state over the unchanged population. */
  cost: number;

  /**
   * One candidate was selected for a local controller update; checkpoint
   * acceptance and normal KKT remain separate.
   */
  accepted: boolean;

  /** All evaluated candidates, including qualified unselected ones. */
  iterations: number;

  /** No representable baseline half-step remains; never normal convergence. */
  stalled: boolean;

  /**
   * Exact owned chosen retraction increment; null only when no candidate was
   * selected.
   */
  increment: number[] | null;
}
