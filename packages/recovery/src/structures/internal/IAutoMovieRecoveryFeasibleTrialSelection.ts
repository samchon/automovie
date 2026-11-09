/**
 * One bounded same-base selection, without a normal convergence claim.
 *
 * @evidence contracts/development/design.md#principled-representation Only a completely qualified actual candidate changes state; original-coordinate KKT remains a separate controller operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The selection transfers its chosen state, cost, exact retraction increment and actual evaluation count to the fit owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exhaustion or representational stalling returns an unaccepted base rather than a fallback success.
 * @evidence contracts/development/common.md#meaningful-documentation Acceptance, actual horizon and representational failure are separate from normal termination; a nullable owned increment records exactly the selected physical chart action.
 */
export interface IAutoMovieRecoveryFeasibleTrialSelection<State> {
  /** Chosen detached state, or the unchanged base when accepted is false. */
  state: State;

  /** Original cost of state over the unchanged population. */
  cost: number;

  /** One candidate was selected for a local controller update; checkpoint acceptance and normal KKT remain separate. */
  accepted: boolean;

  /** All evaluated candidates, including qualified unselected ones. */
  iterations: number;

  /** No representable baseline half-step remains; never normal convergence. */
  stalled: boolean;

  /** Exact owned chosen retraction increment; null only when no candidate was selected. */
  increment: number[] | null;
}
