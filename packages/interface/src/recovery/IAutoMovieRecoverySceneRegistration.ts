/**
 * Current registration coverage for one original source at the scene's final
 * accepted revision.
 */
export interface IAutoMovieRecoverySceneRegistration {
  /** Index of this camera in the original source array. */
  viewIndex: number;

  /** Current registration disposition at the final accepted revision. */
  status: "registered" | "insufficient-support" | "refused" | "not-attempted";

  /** Number of distinct landmark and target-feature pairs at the final revision. */
  candidates: number;

  /**
   * Latest index in `attempts` for this source, or null if it never entered the
   * ledger.
   */
  lastAttempt: number | null;

  /**
   * Current coverage reasons, including a same-revision attempt's refusal
   * reasons when applicable.
   */
  reasons: string[];
}
