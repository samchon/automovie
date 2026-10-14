import { productionFileSystem as fileSystem } from "./productionFileSystem";

/**
 * Restore a moved foreign lock without overwriting a successor, preferring an exclusive hard link and falling back to exclusive byte copy. Cleanup failure leaves the restored canonical lock authoritative.
 *
 * @evidence contracts/common.md#principled-implementation link creation and COPYFILE_EXCL both refuse an occupied canonical path, protecting a successor while attempting to restore the quarantined file.
 * @evidence contracts/common.md#clear-and-simple-design One restoration boundary owns link/copy fallback and quarantine removal; release and reclaim decisions remain with their token owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts EEXIST does not authorize overwrite, and failed restore or quarantine removal is swallowed under the existing fail-closed contract rather than reported as successful disposal.
 * @evidence contracts/common.md#meaningful-documentation Names successor protection, copy fallback and retained quarantine on failure; exclusive restoration is not an unconditional recovery guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Hard-link restoration is metadata work; fallback copies T token bytes, with O(T) filesystem work and constant application bookkeeping.
 * @evidence contracts/performance.md#reuse-equivalent-work The exact quarantined bytes are reused for restoration, while its link/copy effects are attempted independently of previous release outcomes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A successful restore then attempts quarantine removal; failed restore or cleanup may retain the backup, deliberately preserving evidence rather than deleting an unreturned foreign lock.
 */
export const projectCommitLockRestoreQuarantinedLock: (quarantine: string, lockPath: string) => void = (quarantine: string, lockPath: string): void => {
  try {
    fileSystem.linkSync(quarantine, lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return;
    try {
      fileSystem.copyFileSync(
        quarantine,
        lockPath,
        fileSystem.constants.COPYFILE_EXCL,
      );
    } catch {
      return;
    }
  }
  try {
    fileSystem.rmSync(quarantine, { force: true });
  } catch {
    // The canonical foreign lock is restored; an extra hard link or backup
    // is fail-closed evidence and must not endanger the resident owner.
  }
};
