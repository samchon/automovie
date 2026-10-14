/**
 * The checked numerical realm's original source witness changed during startup
 * or before a later command. Stream and HTTP failures retain this identity so
 * their arrival order cannot turn measured invalidation into a generic loss.
 * A fresh candidate can read the new bytes; retrying the rejected realm cannot
 * establish its authority. An unchanged source or numerical error retains its
 * ordinary refusal and never acquires this recovery merely by waiting.
 *
 * @evidence contracts/common.md#principled-implementation createHumanViewerNodeService reports measured source/configuration replacement with this subtype, and numerical transport reconstructs that same classification instead of flattening it into an unrelated stream failure.
 * @evidence contracts/common.md#clear-and-simple-design Separates an invalidated checked realm from ordinary numerical or network refusal so page generation recovery can select a fresh source candidate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The marker follows an actual source witness comparison, not exception text or a waiting interval; retrying the rejected realm cannot re-establish its authority.
 * @evidence contracts/common.md#meaningful-documentation Documents the source witness cause and replacement boundary; the empty Error subclass neither checks source bytes itself nor owns the new realm startup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inherited Error construction chooses no file hashing or loader algorithm; those costs belong to node-service source admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The old checked realm's results cannot be shared after invalidation; the replacement owner must acquire a current witness rather than reuse this error as admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains its diagnostic message/stack while referenced, not the source files, loader session or worker handle; realm retirement and all pending-request rejection belong to their transport owners.
 */
export class HumanViewerNodeSourceChangedError extends Error {}
