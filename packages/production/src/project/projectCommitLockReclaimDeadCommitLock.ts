import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { projectCommitLockInspectCommitLockSnapshot } from "./projectCommitLockInspectCommitLockSnapshot";

/**
 * Replace a proven dead-owner lock under an exclusive .reclaim staging fence after a second matching token, file identity and absence observation. Unknown or live-owner evidence refuses transfer.
 *
 * @evidence contracts/common.md#principled-implementation Exclusive staging creation serializes reclaimers, and the second survey must retain absent owner, token and device/inode identity before same-path rename transfers ownership.
 * @evidence contracts/common.md#clear-and-simple-design Reclamation owns its staging fence and second survey; acquisition owns retry cadence and installs local held depth only after this transfer reports success.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Age and PID occupancy are not liveness proof; a changed token or identity leaves the resident lock alone and failed cleanup may preserve a staging fence.
 * @evidence contracts/common.md#meaningful-documentation Documents the two observations, exclusive staging and crash residue; the finite observations do not provide an atomic compare-and-swap filesystem primitive.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of owner surveys and token operations drive work, with O(T) token storage and provider-dependent process-query latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the first survey's exact token and identity can authorize the second transfer; stale observations are compared rather than reused as current authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful rename consumes staging, refusal and failure attempt its removal, and a crash or failed rm can leave .reclaim blocking future reclaim attempts without claiming ownership release.
 */
export const projectCommitLockReclaimDeadCommitLock: (lockPath: string, token: string) => boolean = (lockPath: string, token: string): boolean => {
  const observed: ReturnType<typeof projectCommitLockInspectCommitLockSnapshot> = projectCommitLockInspectCommitLockSnapshot(lockPath);
  if (
    observed === null ||
    observed.snapshot === null ||
    observed.holder.state !== "absent"
  )
    return false;
  const staging: string = `${lockPath}.reclaim`;
  try {
    fileSystem.writeFileSync(staging, token, { flag: "wx" });
  } catch {
    return false;
  }
  try {
    const resident: ReturnType<typeof projectCommitLockInspectCommitLockSnapshot> = projectCommitLockInspectCommitLockSnapshot(lockPath);
    if (
      resident === null ||
      resident.snapshot === null ||
      resident.holder.state !== "absent" ||
      resident.snapshot.identity !== observed.snapshot.identity ||
      resident.snapshot.token !== observed.snapshot.token
    ) {
      fileSystem.rmSync(staging, { force: true });
      return false;
    }
    fileSystem.renameSync(staging, lockPath);
    return true;
  } catch {
    try {
      fileSystem.rmSync(staging, { force: true });
    } catch {
      // The resident lock is untouched either way; a staging file left behind
      // costs a later reclaim, not correctness.
    }
    return false;
  }
};
