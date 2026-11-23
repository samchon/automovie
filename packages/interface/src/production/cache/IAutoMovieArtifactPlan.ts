/**
 * Which keyed artifacts of one run are computed, reused or re-verified, as
 * planned by `planAutoMovieArtifacts` before any work starts.
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
