import type { IHumanViewerMovedDomains } from "./IHumanViewerMovedDomains.js";

/**
 * The revision owner as source watching uses it.
 *
 * @evidence contracts/common.md#principled-implementation Watching queries graph reach synchronously and submits edits asynchronously to the revision owner, which reports only actually moved domains.
 * @evidence contracts/common.md#clear-and-simple-design The watch seam exposes reach and changed operations without allowing source watchers to manipulate hash caches directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed-domain results come from source dependencies rather than assuming every watched edit invalidates every numerical cache.
 * @evidence contracts/common.md#meaningful-documentation The comments identify graph membership and off-request recomputation after recording changed paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This watch-facing capability selects no import graph traversal or worker batching algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Revision owners retain source texts by path, invalidate edited entries and compare domain digests before reporting movement.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The watcher borrows revision operations; thread termination and pending-batch ownership remain with the revision implementation.
 *
 * @author Samchon
 */
export interface IHumanViewerSourceRevisions {
  /**
   * Whether a file can move a domain through its import graph or checked-loader input scope.
   *
   * @evidence contracts/common.md#principled-implementation Reach includes graph dependencies and checked-loader inputs, including new supported source files inside checked roots.
   * @evidence contracts/common.md#clear-and-simple-design The watcher asks one source authority instead of duplicating import-graph and checked-scope filtering.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unimported checked source files are not excluded merely because no executed module references them.
   * @evidence contracts/common.md#meaningful-documentation The member identifies both import-graph reach and the checked-loader scope that can affect admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no membership representation; the owner uses reached sets and checked-root predicates.
   * @evidence contracts/performance.md#reuse-equivalent-work Reach reads the owner's completed graph state without rereading source bytes; edit processing refreshes that authority.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reach query acquires no watcher or worker handle and leaves retained graphs with the revision owner.
   */
  reaches: (file: string) => boolean;

  /**
   * Record changed files and name the revision domains they moved, computed off the request thread.
   *
   * @evidence contracts/common.md#principled-implementation Edit batches invalidate changed source entries and compare recomputed domain digests before reporting movement.
   * @evidence contracts/common.md#clear-and-simple-design The asynchronous operation keeps heavy graph computation with the revision worker rather than the request-serving watcher.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A watched edit is not assumed to move every domain; returned movement follows actual dependency digests.
   * @evidence contracts/common.md#meaningful-documentation The comment states changed-file recording, moved-domain output and computation outside the request thread.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The edit-submission declaration does not select graph traversal or worker message batching algorithms.
   * @evidence contracts/performance.md#reuse-equivalent-work The revision implementation reuses source text only until its path changes and compares domain hashes against the prior completed batch.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The revision worker owns pending edit replies until answer or worker failure; this borrowed callback transfers no thread ownership.
   */
  changed: (files: string[]) => Promise<IHumanViewerMovedDomains>;
}
