/**
 * Display completion or connection retirement sent to the existing numerical worker. Current page callers flush after drawing, and the numerical reply does not await optional persistence. Encoding still occupies that worker's event loop between cooperative yields, so this protocol does not guarantee zero latency for later requests.
 *
 * @evidence contracts/common.md#principled-implementation Carries explicit post-display flush or producing-request discard to the existing optional preview persistence owner.
 * @evidence contracts/common.md#clear-and-simple-design Keeps cache effects separate from original numerical result replies and foreground construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Flush does not precede display in current callers, and discard cancels optional work without deleting previously stored cache entries.
 * @evidence contracts/common.md#meaningful-documentation Documents producing id for discard and absent id for flush; the plain optional field does not itself enforce command correlation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The envelope performs no write; persistence codec/network work scales with the retained preview bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The owner flushes only its latest pending projection and matches discard by producing id rather than equal timing or labels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One active plus one pending projection bound task count, while active encoding/fetch bytes remain until actual settlement without a byte cap.
 *
 * @author Samchon
 */
export interface IHumanViewerPersistenceCommand {
  /** Flush after drawing; discard withdraws one retired connection's result. */
  persistence: "flush" | "discard";

  /** Producing request when discarding; absent for the single pending flush. */
  id?: number;
}
