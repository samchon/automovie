import { productionFileSystem as fileSystem } from "./productionFileSystem";
import type { projectCommitLockCommitLockSnapshot } from "./projectCommitLockCommitLockSnapshot";
import { projectCommitLockReadCommitLockSnapshot } from "./projectCommitLockReadCommitLockSnapshot";
import { projectCommitLockReadCommitLockOwner } from "./projectCommitLockReadCommitLockOwner";
import { projectCommitLockCommitLockOwnerState } from "./projectCommitLockCommitLockOwnerState";
import type { projectCommitLockCommitLockInspection } from "./projectCommitLockCommitLockInspection";

/**
 * Combine resident token/file facts with validated process-owner observation. Unknown states retain their reason and any readable owner; only ENOENT becomes no holder.
 *
 * @evidence contracts/common.md#principled-implementation The exact snapshot supplies token and identity; owner-shape validation precedes host/process-generation observation, so unreadability or PID reuse cannot authorize reclamation.
 * @evidence contracts/common.md#clear-and-simple-design This operation joins filesystem and process facts into a holder plus optional snapshot; public inspection projects the holder and reclamation consumes both.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read failures and nonregular identities produce explicit unknown evidence, and process-query uncertainty is retained instead of guessed dead.
 * @evidence contracts/common.md#meaningful-documentation Documents absent versus unknown outcomes, retained failure reason and the narrower authority needed by reclamation.
 * @evidence contracts/performance.md#efficient-algorithms Reads T token bytes and invokes at most one process-owner query; JSON parsing is O(T), temporary facts are token-sized and query cost belongs to the host provider.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation renews resident and process evidence; readable token data is shared within this survey, never cached across ownership changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Snapshot descriptors close in their own scope and process observation supplies values; this operation retains no handles, returning only holder and token/identity records to its caller.
 */
export const projectCommitLockInspectCommitLockSnapshot: (lockPath: string) => projectCommitLockCommitLockInspection | null = (
  lockPath: string,
): projectCommitLockCommitLockInspection | null => {
  let resident: projectCommitLockCommitLockSnapshot | null;
  try {
    resident = projectCommitLockReadCommitLockSnapshot(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    return {
      holder: {
        path: lockPath,
        owner: null,
        state: "unknown",
        reason: "lock-read-unavailable",
      },
      snapshot: null,
    };
  }
  if (resident === null) {
    try {
      fileSystem.lstatSync(lockPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    }
    return {
      holder: {
        path: lockPath,
        owner: null,
        state: "unknown",
        reason: "lock-read-unavailable",
      },
      snapshot: null,
    };
  }
  const owner: ReturnType<typeof projectCommitLockReadCommitLockOwner> = projectCommitLockReadCommitLockOwner(resident.token);
  if (owner === null)
    return {
      holder: {
        path: lockPath,
        owner: null,
        state: "unknown",
        reason: "invalid-owner",
      },
      snapshot: resident,
    };
  const observation: ReturnType<typeof projectCommitLockCommitLockOwnerState> = projectCommitLockCommitLockOwnerState(owner);
  return {
    holder:
      observation.state === "unknown"
        ? {
            path: lockPath,
            owner,
            state: "unknown",
            reason: observation.reason,
          }
        : { path: lockPath, owner, state: observation.state },
    snapshot: resident,
  };
};
