import fs from "node:fs";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { subjectInspectionINSPECTION_LOCK_PATH } from "./subjectInspectionINSPECTION_LOCK_PATH";

/**
 * Publish one inspection file through a staged sibling under the inspection lock.
 *
 * @evidence contracts/common.md#principled-implementation Parent creation and exclusive project lock precede staged-byte write and same-directory rename.
 * @evidence contracts/common.md#clear-and-simple-design Plan, PNG and per-view receipt publication share this small file owner while journal mutation remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoded caller paths are a premise; these raw writes do not independently fence symlink ancestry, and failure can leave staged bytes.
 * @evidence contracts/common.md#meaningful-documentation Publication is per-file, not an atomic whole-plan/PNG/receipt sweep transaction.
 * @evidence contracts/performance.md#efficient-algorithms Directory/lock operations and supplied byte writes dominate cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared commit-lock implementation owns waiting/reentrancy/release rather than another local lock protocol.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The token releases in finally on success/failure; input bytes are borrowed, resident files persist and staged failure cleanup is not performed here.
 */
export function subjectInspectionPublishInspectionFile(
  root: string,
  relative: string,
  bytes: Buffer
): void {
  const absolute: string = path.join(root, ...relative.split("/"));
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const lockFile: string = path.join(root, ...subjectInspectionINSPECTION_LOCK_PATH.split("/"));
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  const token: string = acquireCommitLock(lockFile);
  try {
    const staged: string = `${absolute}.staged`;
    fs.writeFileSync(staged, bytes);
    fs.renameSync(staged, absolute);
  } finally {
    releaseCommitLock(lockFile, token);
  }
}
