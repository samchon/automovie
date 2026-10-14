import { releaseCommitLock } from "../project/commitLock";
import { IAutoMovieProductionRootNamespaceLease, assertProductionRootNamespaceLease } from "./rootNamespaceLock";

/**
 * Release the resident token only while the root lease still validates. After root/token identity refusal, withdraw only the process-local nesting level with unlink=false so a replacement namespace is never followed.
 *
 * @evidence contracts/common.md#principled-implementation A fresh lease assertion selects physical resident release versus local-only withdrawal, preserving the acquired namespace witness as the mutation premise.
 * @evidence contracts/common.md#clear-and-simple-design One release boundary serves apply and rollback failure paths without duplicating root-identity fallback logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale lease never authorizes resident-path deletion into a successor root; local-only release does not claim old physical lock retirement.
 * @evidence contracts/common.md#meaningful-documentation Documents current-root release, unlink=false fallback and the unresolved old-path physical ownership after replacement.
 * @evidence contracts/performance.md#efficient-algorithms Uses C current coordinate/token checks plus one canonical resident release or local depth update, with each owner accounting for its token/native cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the original lease and token but renews lease authority before the effect; no previously successful assertion is reused as current permission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the matching local nesting level and attempts native release only under current authority; root drift can leave the old resident fence without touching the replacement namespace.
 */
export const legacyImporterReleaseResidentLockIfCurrent: (lease: IAutoMovieProductionRootNamespaceLease, lockPath: string, token: string) => void = (
  lease: IAutoMovieProductionRootNamespaceLease,
  lockPath: string,
  token: string,
): void => {
  try {
    assertProductionRootNamespaceLease(lease);
  } catch {
    // Release only process-local ownership: never follow a stale resident path
    // into a replacement root.
    releaseCommitLock(lockPath, token, { unlink: false });
    return;
  }
  releaseCommitLock(lockPath, token);
};
