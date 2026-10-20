/**
 * Source-order registration status against the last accepted checkpoint.
 *
 * @evidence contracts/common.md#principled-implementation Distinct existing-map candidate count is separate from geometric acceptance and the most recent attempt's revision.
 * @evidence contracts/common.md#clear-and-simple-design One per-source record explains null poses, insufficient support and never-attempted or refused extensions without treating partial component success as full coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate count is not an inlier count or proof of material correspondence; an earlier-revision refusal is not silently treated as a current attempt.
 * @evidence contracts/common.md#meaningful-documentation Members define source index, current status, support and attempt-ledger linkage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The coordinator derives it from the final accepted checkpoint and existing attempt ledger.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only caller-owned plain scalar/reason data is retained.
 */
export interface IAutoMovieRecoverySceneRegistration {
  /** Index in the fixed source array. */
  viewIndex: number;

  /** Current accepted checkpoint status, not an attempted pose. */
  status: "registered" | "insufficient-support" | "refused" | "not-attempted";

  /** Distinct existing landmark/target feature pairs at the final accepted revision. */
  candidates: number;

  /** Latest attempt ledger index for this source, possibly at an earlier revision; null if never attempted. */
  lastAttempt: number | null;

  /** Current status or same-revision refusal reasons; historical details stay in attempts. */
  reasons: string[];
}
