import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";

/**
 * The latest warm failure with when and on which revision it happened.
 *
 * @evidence contracts/common.md#principled-implementation Extending a document warm failure with ISO time and source revision preserves which pass produced the latest refusal.
 * @evidence contracts/common.md#clear-and-simple-design The latest-failure record reuses id/reason members and adds only provenance needed across warm-pass counter resets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A new pass does not erase the prior cause by manufacturing a clean history or a successful replacement frame.
 * @evidence contracts/common.md#meaningful-documentation Members document the ISO failure time and the source revision warmed by the failed pass.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This provenance extension performs no chronological selection or capture operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Latest-failure retention is a diagnostic history slot rather than result reuse or a thumbnail cache key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The warming owner keeps only one latest failure across pass resets; this record retains no image or GPU task.
 *
 * @author Samchon
 */
export interface IHumanViewerWarmLastFailure extends IHumanViewerWarmFailure {
  /** ISO time of the failure. */
  at: string;

  /** The source revision the pass warmed. */
  revision: string;
}
