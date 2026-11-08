/**
 * Which keyed artifacts of one run are computed, reused or re-verified, as
 * planned by `planAutoMovieArtifacts` before any work starts.
 *
 * @evidence contracts/development/design.md#principled-representation One action per requested key, in request order, plus the three counts that sum to the request length; `reuse` covers both stored entries and later repeats of a key computed earlier in the same run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns the plan beside its planner; Render's frame cache reads the actions to drive capture and the counts to report progress.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actions are a closed union rather than booleans, so a frame cannot be both reused and verified.
 * @evidence contracts/development/common.md#meaningful-documentation Defines each action and the count invariant.
 */
export interface IAutoMovieArtifactPlan {
  /**
   * Per requested key, in order: `compute` when no stored or earlier entry
   * exists, `reuse` when one does, `verify` when one does but this position is
   * sampled for recomputation and comparison.
   */
  actions: ("compute" | "reuse" | "verify")[];

  /** Number of `compute` actions. */
  compute: number;

  /** Number of `reuse` actions. */
  reuse: number;

  /** Number of `verify` actions. */
  verify: number;
}
