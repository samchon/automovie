import type { BigIntStats } from "node:fs";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import type { projectCommitLockCommitLockSnapshot } from "./projectCommitLockCommitLockSnapshot";
import type { projectCommitLockCommitLockDescriptorFailure } from "./projectCommitLockCommitLockDescriptorFailure";
import { projectCommitLockCloseCommitLockDescriptor } from "./projectCommitLockCloseCommitLockDescriptor";
import { projectCommitLockLockIdentity } from "./projectCommitLockLockIdentity";

/**
 * Read a token only when linked path, opened descriptor and a second resident descriptor agree on one regular file. Identity drift returns null; read/close errors propagate with their original causes.
 *
 * @evidence contracts/common.md#principled-implementation Device/inode checks across lstat and fstat detect path replacement, and a second opened resident descriptor witnesses the original opened file before its token is accepted.
 * @evidence contracts/common.md#clear-and-simple-design The reader owns both descriptor scopes and delegates error-preserving close to one helper; callers consume token and identity together rather than separate uncoordinated reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Symlinks and nonregular files return null, and a read error never becomes proof of absence or permission to reclaim a foreign lock.
 * @evidence contracts/common.md#meaningful-documentation States the identity witnesses, null refusal and combined cleanup failures; two reads are still finite observations rather than an atomic filesystem transaction.
 * @evidence contracts/performance.md#efficient-algorithms Per observation uses a fixed number of stats and two opens plus reading T token bytes, with O(T) storage; the current implementation imposes no token-byte limit.
 * @evidence contracts/performance.md#reuse-equivalent-work Snapshots are read afresh because resident-path identity may change between calls; no age or quiet-path cache is considered ownership evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every successfully opened descriptor has a finally close attempt, including null/refusal paths; a failed native close is reported and cannot be claimed physically completed.
 */
export const projectCommitLockReadCommitLockSnapshot: (lockPath: string) => projectCommitLockCommitLockSnapshot | null = (
  lockPath: string,
): projectCommitLockCommitLockSnapshot | null => {
  const linked: BigIntStats = fileSystem.lstatSync(lockPath, { bigint: true });
  if (linked.isSymbolicLink() || linked.isFile() === false) return null;
  const linkedIdentity: string = projectCommitLockLockIdentity(linked);
  const descriptor: number = fileSystem.openSync(lockPath, "r");
  let failure: projectCommitLockCommitLockDescriptorFailure | undefined;
  try {
    const opened: BigIntStats = fileSystem.fstatSync(descriptor, { bigint: true });
    if (opened.isFile() === false) return null;
    const token: string = fileSystem.readFileSync(descriptor, "utf8");
    const resident: BigIntStats = fileSystem.lstatSync(lockPath, { bigint: true });
    if (
      resident.isSymbolicLink() ||
      resident.isFile() === false ||
      projectCommitLockLockIdentity(resident) !== linkedIdentity
    )
      return null;
    const residentDescriptor: number = fileSystem.openSync(lockPath, "r");
    let residentFailure: projectCommitLockCommitLockDescriptorFailure | undefined;
    try {
      const current: BigIntStats = fileSystem.fstatSync(residentDescriptor, {
        bigint: true,
      });
      if (
        current.isFile() === false ||
        projectCommitLockLockIdentity(current) !== projectCommitLockLockIdentity(opened)
      )
        return null;
    } catch (error) {
      residentFailure = { error };
      throw error;
    } finally {
      projectCommitLockCloseCommitLockDescriptor(residentDescriptor, residentFailure, lockPath);
    }
    return { identity: projectCommitLockLockIdentity(opened), token };
  } catch (error) {
    failure = { error };
    throw error;
  } finally {
    projectCommitLockCloseCommitLockDescriptor(descriptor, failure, lockPath);
  }
};
