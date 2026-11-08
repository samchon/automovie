/**
 * One detached actual evaluation against an unchanged feasible base.
 *
 * @evidence contracts/development/design.md#principled-representation Qualification combines every original nonlinear gate, finite strict cost decrease and that path's Armijo condition.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This record owns an actual candidate, while the selector owns ordering and the nonlinear controller owns normal termination.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A low cost cannot replace geometry or its own Armijo qualification.
 * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish detached state, nullable measured cost, complete qualification and the exact owned physical retraction increment.
 */
export interface IAutoMovieRecoveryFeasibleCandidate<State> {
  /** Detached trial in the same chart and observation population as its base. */
  state: State;

  /** Nullable raw same-population objective; a finite value alone does not qualify this candidate. */
  cost: number | null;

  /** Every original gate, finite strict decrease and own Armijo test passed. */
  qualified: boolean;

  /** Owned physical increment passed unchanged to this candidate's retraction, including its actual arc amount and correction. */
  increment: number[];
}
