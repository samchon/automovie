/**
 * Optional admitted-preview persistence remains independent of construction.
 *
 * @evidence contracts/common.md#principled-implementation Stored, cancelled and failed report optional preview persistence independently of model completion.
 * @evidence contracts/common.md#clear-and-simple-design One cache key, result state and optional measured durations describe the persistence owner outcome.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Persistence notifications cannot turn construction into an admitted preview or rewrite numerical output.
 * @evidence contracts/common.md#meaningful-documentation Cache encoding and writing durations are milliseconds of their own operations; error accompanies failed persistence.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalPersistenceMessage {
  /**
   * Optional numerical-preview persistence notification, separate from build and admission replies.
   */
  type: "persistence";

  /** Immutable numerical cache identity captured with the producing preview. */
  key: string;

  /** Actual persistence outcome: stored, explicitly withdrawn, or failed. */
  state: "stored" | "cancelled" | "failed";

  /**
   * Worker milliseconds spent encoding this preview, when the owner reports them.
   */
  cacheEncodeMs?: number;

  /**
   * Worker milliseconds spent writing this encoded preview, when the owner reports them.
   */
  cacheWriteMs?: number;

  /**
   * Original persistence failure reason; absent when no failure was reported.
   */
  error?: string;
}
