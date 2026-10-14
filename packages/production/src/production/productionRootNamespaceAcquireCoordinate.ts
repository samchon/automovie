import { acquireCommitLock } from "../project/commitLock";

/**
 * Acquire the supplied external commit-lock coordinate and return its exact path/token pair. Nested acquisition uses the underlying process-local commit-lock depth.
 *
 * @evidence contracts/common.md#principled-implementation The canonical commit-lock owner performs exclusive creation and token proof; this value pair identifies the exact nesting level its caller must release.
 * @evidence contracts/common.md#clear-and-simple-design A thin acquisition projection keeps namespace-set coordination separate from the one commit-lock implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second depth map or token substitute changes re-entry and foreign-owner exclusion semantics.
 * @evidence contracts/common.md#meaningful-documentation Documents returned path/token and that the caller must balance the underlying nested acquisition.
 * @evidence contracts/performance.md#efficient-algorithms Local record construction is constant work beyond the underlying token-byte, contention and process-survey costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the established commit-lock depth/token when the same process re-enters this coordinate rather than creating a parallel namespace cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success transfers one held nesting level to the returned pair; the caller must release it, and no detached cleanup task is created.
 */
export const productionRootNamespaceAcquireCoordinate: (lockPath: string) => { path: string; token: string } = (
  lockPath: string,
): { path: string; token: string } => ({
  path: lockPath,
  token: acquireCommitLock(lockPath),
});
