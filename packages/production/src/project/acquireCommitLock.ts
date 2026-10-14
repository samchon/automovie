import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { projectCommitLockCommitLockReclaimAttempts } from "./projectCommitLockCommitLockReclaimAttempts";
import { projectCommitLockCommitLockReclaimPauseMs } from "./projectCommitLockCommitLockReclaimPauseMs";
import { projectCommitLockHeld } from "./projectCommitLockHeld";
import { projectCommitLockWaitForRelease } from "./projectCommitLockWaitForRelease";
import { projectCommitLockCommitLockToken } from "./projectCommitLockCommitLockToken";
import { projectCommitLockDeniedCommitLockError } from "./projectCommitLockDeniedCommitLockError";
import { projectCommitLockContendedCommitLockError } from "./projectCommitLockContendedCommitLockError";
import { projectCommitLockReclaimDeadCommitLock } from "./projectCommitLockReclaimDeadCommitLock";

/**
 * Acquire one exclusively created commit-lock token, sharing this process's token for nested operations. Filesystem denial refuses immediately; contention waits about two seconds and only a proven absent owner permits reclamation.
 *
 * @evidence contracts/common.md#principled-implementation Exclusive wx creation establishes ownership, a depth map identifies re-entry, and two exact owner observations guard dead-owner transfer; a PID occupied by another generation never authorizes reclaim.
 * @evidence contracts/common.md#clear-and-simple-design The acquisition loop owns deadline and reclaim cadence; token creation, owner observation and transfer remain separate operations because they have different failure boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Three reclaim attempts and 500 ms spacing address transient file-handle contention; permission errors and unrecognized errno values are not disguised as contention.
 * @evidence contracts/common.md#meaningful-documentation Documents the returned token, re-entry, permission refusal, approximate deadline and the proof needed to reclaim; wall-clock changes can affect the wait duration.
 * @evidence contracts/performance.md#efficient-algorithms Each iteration attempts exclusive creation; each of at most three reclamations performs up to two owner surveys, and final contention refusal surveys once more. Local acquisition state is constant-sized, while token bytes and native process-query cost belong to their providers.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the exact path's resident process-local token is reused, increasing depth; independent acquisitions and their filesystem effects are not cached by result equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful acquisition adds one map entry until matching release or explicit retirement; callers must balance nested acquisitions and an unreleased path can remain retained without a numeric population cap.
 */
export const acquireCommitLock: (lockPath: string) => string = (lockPath: string): string => {
  const current: { token: string; depth: number; } | undefined = projectCommitLockHeld.get(lockPath);
  if (current !== undefined) {
    ++current.depth;
    return current.token;
  }
  const token: string = projectCommitLockCommitLockToken();
  const deadline: number = Date.now() + 2_000;
  let reclaims: number = 0;
  let nextReclaim: number = Date.now();
  for (;;) {
    try {
      // Exclusive create admits one owner and writes its token before return.
      // Contenders require the separate dead-owner survey and transfer checks.
      fileSystem.writeFileSync(lockPath, token, { flag: "wx" });
      projectCommitLockHeld.set(lockPath, { token, depth: 1 });
      return token;
    } catch (error) {
      const code: string | undefined = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES")
        throw projectCommitLockDeniedCommitLockError(lockPath, error);
      if (code !== "EEXIST") throw error;
      // A few attempts, spaced, rather than one. The transfer renames onto the
      // resident path, and a rename onto an existing path fails outright on
      // Windows while anything else holds a handle on it -- `#1989` measured
      // exactly that, transiently, on this product's own atomic publish. One
      // attempt meant one such collision cost the caller the whole deadline and
      // then a refusal reading "it should have been reclaimed automatically",
      // which is the least useful thing this could say.
      //
      // Spaced, because a reclaim that keeps failing is a handle somebody is
      // holding, and retrying it every two milliseconds would spend the deadline
      // on renames instead of on waiting for that handle to close.
      if (
        reclaims < projectCommitLockCommitLockReclaimAttempts &&
        Date.now() >= nextReclaim
      ) {
        ++reclaims;
        nextReclaim = Date.now() + projectCommitLockCommitLockReclaimPauseMs;
        if (projectCommitLockReclaimDeadCommitLock(lockPath, token)) {
          projectCommitLockHeld.set(lockPath, { token, depth: 1 });
          return token;
        }
      }
      if (Date.now() > deadline) throw projectCommitLockContendedCommitLockError(lockPath);
      projectCommitLockWaitForRelease(2);
    }
  }
};
