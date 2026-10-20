/**
 * One bounded same-base selection, without a normal convergence claim.
 *
 * @evidence contracts/common.md#principled-implementation Only a completely qualified actual candidate changes state; original-coordinate KKT remains a separate controller operation.
 * @evidence contracts/common.md#clear-and-simple-design The selection transfers its chosen state, cost and actual evaluation count to the fit owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exhaustion or representational stalling returns an unaccepted base rather than a fallback success.
 * @evidence contracts/common.md#meaningful-documentation Acceptance, actual work horizon and representational failure are explicit scalars.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased result does no selection work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One state transfers; unselected detached candidates and current-model actions expire at the selector boundary.
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
}
