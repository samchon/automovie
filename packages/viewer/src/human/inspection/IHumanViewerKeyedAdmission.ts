import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";

/**
 * An admission state recorded for one document at the cache key it was asked for; a different key makes it outdated.
 *
 * @evidence contracts/common.md#principled-implementation Pairs one stored admission/verdict or waiting reason with the numerical key under which its document was judged/requested.
 * @evidence contracts/common.md#clear-and-simple-design Lets admission maps keep document-id lookup separate from exact key equivalence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A changed key makes the record outdated even when the document id persists; old replies cannot authorize the new document.
 * @evidence contracts/common.md#meaningful-documentation Documents the key's original-request identity and the difference between actual verdict and pending reason.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no lookup; owning maps provide expected constant-time id access/key comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal id plus numerical key permits kept-state reuse; label or reason equality alone cannot establish source/basis/document equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Verdict/waiting maps retain encountered ids without a count cap or removed-id pruning; the record carries no numerical task or model handle.
 *
 * @author Samchon
 */
export interface IHumanViewerKeyedAdmission {
  /** The cache key the document had when it was asked. */
  key: string;

  /** The owner's verdict, or the pending state with why it waits. */
  admission: IHumanViewerAdmission;
}
