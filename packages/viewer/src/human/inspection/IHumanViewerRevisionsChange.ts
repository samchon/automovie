/**
 * One edit batch sent to the revision worker.
 *
 * @evidence contracts/common.md#principled-implementation An edit message carries normalized changed paths and the new published basis digests so the revision worker computes against one batch's authority.
 * @evidence contracts/common.md#clear-and-simple-design Only invalidated paths and basis state cross the worker channel; source files are read by the worker itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The batch reports actual edits, creations and removals rather than enumerating hardcoded modules to force invalidation.
 * @evidence contracts/common.md#meaningful-documentation Comments specify forward-slash path normalization and basis digests after the edit batch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This message type does not choose invalidation scans or graph hashing strategies.
 * @evidence contracts/performance.md#reuse-equivalent-work Changed paths invalidate worker text memo entries; the supplied basis digest prevents treating a basis replacement as equivalent browser authority.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The change transfers path strings and digests without file handles; the worker queue owns pending message retention.
 *
 * @author Samchon
 */
export interface IHumanViewerRevisionsChange {
  /** Files edited, created or removed, with forward slashes. */
  files: string[];

  /** The published basis digests after the batch. */
  bases: string;
}
