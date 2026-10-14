

/**
 * The closed conclusions a current owner survey can establish. Only absent supports reclamation; an occupied PID does not prove the recorded generation and an unknown result authorizes nothing.
 *
 * @evidence contracts/common.md#principled-implementation The union distinguishes matching generation, absent PID, occupied/reused PID, foreign host and unavailable evidence, matching the canonical process observation contract.
 * @evidence contracts/common.md#clear-and-simple-design One state vocabulary drives both readable holder descriptions and acquisition advice, preventing independent spellings of ownership conclusions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No age state or fixture-specific live/dead result is introduced; occupied and foreign-host evidence never becomes absence.
 * @evidence contracts/common.md#meaningful-documentation Explains each conclusion's authority, especially the narrower absent condition and the uncertainty of PID occupancy.
 * @evidence contracts/performance.md#efficient-algorithms This closed string union has no runtime algorithm; observation cost belongs to the process-query provider.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the same state keys across description and advice but stores no completed or in-flight survey.
 * @evidence contracts/performance.md#bound-retention-and-release-resources State values are ordinary strings with no resource lifetime; current surveys and lock owners determine retention.
 */
export type AutoMovieCommitLockOwnerState =
  | "same-owner"
  | "absent"
  | "occupied-or-reused"
  | "elsewhere"
  | "unknown";
