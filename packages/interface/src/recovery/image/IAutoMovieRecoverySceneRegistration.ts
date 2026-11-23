/** Source-order registration status against the last accepted checkpoint. */
export interface IAutoMovieRecoverySceneRegistration {
  /** Index in the fixed source array. */
  viewIndex: number;

  /** Current accepted checkpoint status, not an attempted pose. */
  status: "registered" | "insufficient-support" | "refused" | "not-attempted";

  /**
   * Distinct existing landmark/target feature pairs at the final accepted
   * revision.
   */
  candidates: number;

  /**
   * Latest attempt ledger index for this source, possibly at an earlier
   * revision; null if never attempted.
   */
  lastAttempt: number | null;

  /**
   * Current status or same-revision refusal reasons; historical details stay in
   * attempts.
   */
  reasons: string[];
}
