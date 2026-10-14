import { projectCommitLockHeld } from "./projectCommitLockHeld";
import { projectCommitLockReadCommitLockSnapshot } from "./projectCommitLockReadCommitLockSnapshot";

/**
 * Recover local depth zero only while an exact fresh snapshot still contains this session's token, so a later acquisition can resume and release a failed retirement.
 *
 * @evidence contracts/common.md#principled-implementation Fresh token equality distinguishes this process's surviving resident file from a successor; depth zero represents recovered ownership awaiting another balanced acquisition.
 * @evidence contracts/common.md#clear-and-simple-design The release path delegates local-entry recovery here after rename/read/cleanup failure, keeping its foreign-owner test in the snapshot reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read failure is swallowed as inability to recover, never interpreted as permission to adopt a foreign token.
 * @evidence contracts/common.md#meaningful-documentation Explains depth-zero recovery and its fresh exact-token condition; absence or unreadability installs no local entry.
 * @evidence contracts/performance.md#efficient-algorithms One token snapshot plus an expected constant-time map update costs O(T) byte work and provider filesystem latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses this process's token only after exact reread; the prior failed release observation alone cannot restore local authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A recovered map entry and resident lock persist until later release, with no independent deadline; an unreadable surviving file may remain a physical fence without a recovered local owner.
 */
export const projectCommitLockReclaimCommitLock: (lockPath: string, token: string) => void = (lockPath: string, token: string): void => {
  try {
    const resident: ReturnType<typeof projectCommitLockReadCommitLockSnapshot> = projectCommitLockReadCommitLockSnapshot(lockPath);
    if (resident !== null && resident.token === token)
      projectCommitLockHeld.set(lockPath, { token, depth: 0 });
  } catch {
    // nothing resident to reclaim
  }
};
