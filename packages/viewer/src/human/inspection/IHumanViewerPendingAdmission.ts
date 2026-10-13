/**
 * One source-aware document verdict awaited from the resident numerical worker. It carries no model and creates no numerical cache entry.
 *
 * @evidence contracts/common.md#principled-implementation Holds the correlated promise callbacks for one document-only owner judgment through the current checked numerical transport.
 * @evidence contracts/common.md#clear-and-simple-design Keeps admission-only settlement separate from model build maps and preview persistence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transport/source failure rejects without a invented numerical verdict; a stale or unknown id cannot settle another request.
 * @evidence contracts/common.md#meaningful-documentation Documents null admission, original refusal string and execution-failure rejection without introducing cache entries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no judgment; map lookup/withdrawal is fixed bookkeeping around actual domain admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared endpoint readiness is reused, but each document judgment retains its own correlation and settlement callbacks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The transport removes callbacks on actual reply/failure/disposal; outstanding admission count has no independent cap in the page map.
 *
 * @author Samchon
 */
export interface IHumanViewerPendingAdmission {
  /**
   * Null is admitted; a string is the domain owner's original refusal.
   *
   * @evidence contracts/common.md#principled-implementation Settles this correlated document-only promise with null admission or the domain owner's refusal string.
   * @evidence contracts/common.md#clear-and-simple-design Leaves schema judgment at the original domain boundary and exposes its result without creating a model reply.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only a validated admission envelope reaches this callback; unavailable transport cannot be converted into null admission.
   * @evidence contracts/common.md#meaningful-documentation Null means owner-admitted and a string is its original cause; current source/request correlation must still be valid.
   * @evidence contracts/performance.md#efficient-algorithms One promise settlement follows expected constant-time correlation lookup and map removal.
   * @evidence contracts/performance.md#reuse-equivalent-work This request has its own resolver even when other requests share endpoint readiness; equal reason text is not shared judgment.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The map entry is removed before callback invocation and promise listeners retain only what their caller needs afterward.
   */
  resolve: (reason: string | null) => void;

  /**
   * Source or worker transport could not supply a verdict.
   *
   * @evidence contracts/common.md#principled-implementation Rejects this document-only promise when source/transport cannot supply an actual owner verdict.
   * @evidence contracts/common.md#clear-and-simple-design Keeps execution failure distinct from a numerical refusal string so callers preserve pending/error semantics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied original Error is not rewritten into admission success, retried work or a cached verdict.
   * @evidence contracts/common.md#meaningful-documentation The callback receives the transport/source cause and correlation entry is withdrawn by the owning failure/disposal path.
   * @evidence contracts/performance.md#efficient-algorithms One request rejection is fixed bookkeeping; terminal failure traverses all currently pending admission callbacks.
   * @evidence contracts/performance.md#reuse-equivalent-work A failed request is not replayed; only an explicit later request may acquire a compatible replacement transport.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Failure/disposal clears its map population after rejecting promises; this callback retains no worker handle or model bytes.
   */
  reject: (error: Error) => void;
}
