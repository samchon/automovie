/**
 * Optional admitted-preview persistence remains independent of construction.
 *
 * @evidence contracts/common.md#principled-implementation Stored, cancelled and failed report optional preview persistence independently of model completion.
 * @evidence contracts/common.md#clear-and-simple-design One cache key, result state and optional measured durations describe the persistence owner outcome.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Persistence notifications cannot turn construction into an admitted preview or rewrite numerical output.
 * @evidence contracts/common.md#meaningful-documentation Cache encoding and writing durations are milliseconds of their own operations; error accompanies failed persistence.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Stored, cancelled and failed report optional preview persistence independently of model completion.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Persistence notifications cannot turn construction into an admitted preview or rewrite numerical output.
 * @author Samchon
 */
export interface IHumanViewerNumericalPersistenceMessage {
  /**
   * Optional numerical-preview persistence notification, separate from build and admission replies.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Keeps optional preview persistence events separate from numerical builds and owner admission verdicts.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Keeps optional preview persistence events separate from numerical builds and owner admission verdicts.
   */
  type: "persistence";

  /**
   * Immutable numerical cache identity captured with the producing preview.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Identifies the immutable source/document/AO cache entry actually targeted by the persistence attempt.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Identifies the immutable source/document/AO cache entry actually targeted by the persistence attempt.
   */
  key: string;

  /**
   * Actual persistence outcome: stored, explicitly withdrawn, or failed.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Distinguishes actually stored, explicitly cancelled and failed preview persistence outcomes.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Distinguishes actually stored, explicitly cancelled and failed preview persistence outcomes.
   */
  state: "stored" | "cancelled" | "failed";

  /**
   * Worker milliseconds spent encoding this preview, when the owner reports them.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Reports the producer's measured encoding milliseconds only when that stage was observed.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Reports the producer's measured encoding milliseconds only when that stage was observed.
   */
  cacheEncodeMs?: number;

  /**
   * Worker milliseconds spent writing this encoded preview, when the owner reports them.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Reports the producer's measured disk-write milliseconds separately from numerical build duration.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Reports the producer's measured disk-write milliseconds separately from numerical build duration.
   */
  cacheWriteMs?: number;

  /**
   * Original persistence failure reason; absent when no failure was reported.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Preserves an actual persistence failure cause without rejecting or reclassifying an already completed model.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Preserves an actual persistence failure cause without rejecting or reclassifying an already completed model.
   */
  error?: string;
}
