/**
 * Source-order registration status against the last accepted checkpoint.
 *
 * @evidence contracts/development/design.md#principled-representation Distinct existing-map candidate count is separate from geometric acceptance and the most recent attempt's revision.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One per-source record explains null poses, insufficient support and never-attempted or refused extensions without treating partial component success as full coverage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Candidate count is not an inlier count or proof of material correspondence; an earlier-revision refusal is not silently treated as a current attempt.
 * @evidence contracts/development/common.md#meaningful-documentation Members define source index, current status, support and attempt-ledger linkage.
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
