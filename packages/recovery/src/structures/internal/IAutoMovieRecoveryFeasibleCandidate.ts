/**
 * One detached actual evaluation against an unchanged feasible base.
 *
 * @evidence contracts/common.md#principled-implementation Qualification combines every original nonlinear gate, finite strict cost decrease and that path's Armijo condition.
 * @evidence contracts/common.md#clear-and-simple-design This record owns an actual candidate, while the selector owns ordering and the nonlinear controller owns normal termination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A low cost cannot replace geometry or its own Armijo qualification.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish detached state, nullable measured cost, complete qualification and the exact owned physical retraction increment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cross-state cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most four detached comparison states share one base. Best/mixed may retain two additional physical increments beside the current one; the owner admits that peak and releases unselected records after selection.
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
