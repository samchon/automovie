/**
 * One document a warm pass could not draw, with the reason.
 *
 * @evidence contracts/common.md#principled-implementation A warm failure associates one document id with its actual capture-refusal reason for health reporting.
 * @evidence contracts/common.md#clear-and-simple-design The two-field result keeps per-document failure reporting separate from warm-pass counters and source revision metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed captures remain failures with causes rather than being counted as successful thumbnails for selected inputs.
 * @evidence contracts/common.md#meaningful-documentation The member comments identify the failed document and the reason its capture failed.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The failure value chooses no queue scheduling, capture or error-classification algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A failed warm attempt is diagnostic evidence, not a cached successful image usable by later requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The failure stores labels and text without retaining the failed capture's browser task or frame buffers.
 *
 * @author Samchon
 */
export interface IHumanViewerWarmFailure {
  /** Document id. */
  id: string;

  /** Why its capture failed. */
  reason: string;
}
