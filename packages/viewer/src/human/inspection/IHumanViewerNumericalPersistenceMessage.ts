/**
 * Optional admitted-preview persistence remains independent of construction.
 *
 * @evidence contracts/common.md#principled-implementation Reports the optional admitted-preview owner's stored/cancelled/failed outcome under the producing immutable cache key.
 * @evidence contracts/common.md#clear-and-simple-design Keeps persistence telemetry independent of construction/export replies and completed display success.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional cache failure cannot fabricate a numerical failure or successful store; outcome is not artifact-digest validation or corruption quarantine.
 * @evidence contracts/common.md#meaningful-documentation Documents key, actual outcome, optional worker encoding/write milliseconds and absent error when none was reported.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no encode/write; preview persistence owns chunk generation, network bytes and cache publication.
 * @evidence contracts/performance.md#reuse-equivalent-work Persistence is tied to the producing preview/key and explicit flush/discard effects; construct/export results are not substituted into this codec.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page retains the latest notification only while the persistence owner bounds its staged jobs; this record stores no model or encoded bytes.
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
