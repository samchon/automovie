import { randomUUID } from "node:crypto";
import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { projectCommitLockHeld } from "./projectCommitLockHeld";
import { projectCommitLockReadCommitLockSnapshot } from "./projectCommitLockReadCommitLockSnapshot";
import { projectCommitLockRestoreQuarantinedLock } from "./projectCommitLockRestoreQuarantinedLock";
import { projectCommitLockReclaimCommitLock } from "./projectCommitLockReclaimCommitLock";

/**
 * Release only this token's nesting level and exact resident lock. Namespace retirement removes all matching local depth without resident I/O; unlink=false withdraws local ownership after a root identity failure.
 *
 * @evidence contracts/common.md#principled-implementation Token and opened-file identity are checked before and after same-directory quarantine; a replacement is restored with exclusive creation rather than removed as this owner's file.
 * @evidence contracts/common.md#clear-and-simple-design Depth withdrawal precedes physical retirement, while separate restore and reclaim helpers retain successor protection and recover this process's still-resident token after a failed release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A foreign token never gains an ownership entry and retire or unlink=false never follows a vanished namespace; caught cleanup failures preserve a resident fence rather than inventing release success.
 * @evidence contracts/common.md#meaningful-documentation States outermost release, explicit namespace retirement and stale-path withdrawal, with physical cleanup failures swallowed under the established void-return contract.
 * @evidence contracts/performance.md#efficient-algorithms Local depth lookup is expected constant time; outer release reads T token bytes without a local byte cap and performs a fixed number of identity, rename and restore operations, excluding host filesystem latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested levels share the same token and defer filesystem removal until the outer level; a failed release restores local ownership only after rereading this exact token.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Normal outer release removes the held map entry and verified quarantine; failed retirement can retain a lock or backup, and the caller receives no structured cleanup outcome from this existing API.
 */
export const releaseCommitLock: (lockPath: string, token: string, options?: { unlink?: boolean; retire?: boolean }) => void = (
  lockPath: string,
  token: string,
  options: { unlink?: boolean; retire?: boolean } = {},
): void => {
  const current: { token: string; depth: number; } | undefined = projectCommitLockHeld.get(lockPath);
  let owned: boolean = false;
  if (current !== undefined && current.token === token) {
    if (options.retire !== true && current.depth > 1) {
      --current.depth;
      return;
    }
    projectCommitLockHeld.delete(lockPath);
    owned = true;
  }
  if (options.retire === true || options.unlink === false) return;
  try {
    const observed: ReturnType<typeof projectCommitLockReadCommitLockSnapshot> = projectCommitLockReadCommitLockSnapshot(lockPath);
    if (observed === null || observed.token !== token) return;
    const quarantine: string = path.join(
      path.dirname(lockPath),
      `.automovie-lock-release-${process.pid}-${randomUUID()}`,
    );
    try {
      fileSystem.renameSync(lockPath, quarantine);
    } catch {
      // A failed rename may leave this token resident after local withdrawal.
      // Recover local depth only when a fresh read still finds our exact token.
      if (owned) projectCommitLockReclaimCommitLock(lockPath, token);
      return;
    }
    try {
      const moved: ReturnType<typeof projectCommitLockReadCommitLockSnapshot> = projectCommitLockReadCommitLockSnapshot(quarantine);
      if (
        moved !== null &&
        moved.identity === observed.identity &&
        moved.token === token
      )
        fileSystem.rmSync(quarantine, { force: true });
      else projectCommitLockRestoreQuarantinedLock(quarantine, lockPath);
    } catch {
      projectCommitLockRestoreQuarantinedLock(quarantine, lockPath);
      if (owned) projectCommitLockReclaimCommitLock(lockPath, token);
    }
  } catch {
    // A read failure proves neither absence nor replacement. Recover the
    // process-local entry only if a fresh exact read still finds our token.
    if (owned) projectCommitLockReclaimCommitLock(lockPath, token);
  }
};
