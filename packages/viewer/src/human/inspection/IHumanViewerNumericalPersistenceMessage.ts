/**
 * Optional admitted-preview persistence remains independent of construction.
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
