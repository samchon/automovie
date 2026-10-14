import { productionFileSystem as fileSystem } from "./productionFileSystem";
import type { projectCommitLockCommitLockDescriptorFailure } from "./projectCommitLockCommitLockDescriptorFailure";
import { CommitLockDescriptorCleanupError } from "./CommitLockDescriptorCleanupError";

/**
 * Attempt one descriptor close, preserving an earlier read failure alongside close failure and flattening an existing descriptor-cleanup aggregate.
 *
 * @evidence contracts/common.md#principled-implementation Finally callers supply their actual read failure; a lone close error propagates unchanged and an existing cleanup aggregate contributes its original error sequence before the new close cause.
 * @evidence contracts/common.md#clear-and-simple-design One close boundary owns error composition for both descriptors in the snapshot reader, avoiding independent replacement of the same primary failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No descriptor retry or synthetic success hides native close failure; the aggregate preserves causes instead of substituting an errno unrelated to the read.
 * @evidence contracts/common.md#meaningful-documentation Explains unchanged lone failure, ordered combined causes and the native close completion limit.
 * @evidence contracts/performance.md#efficient-algorithms The native close is one operation; composing an existing aggregate copies E causes in O(E) time and retained error-array space.
 * @evidence contracts/performance.md#reuse-equivalent-work Error objects are retained by reference and only an existing aggregate's cause array is flattened; descriptor-close effects are attempted once per owning finally.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the descriptor until this attempt; successful close ends it, while failed close throws and leaves its physical state unresolved rather than clearing a handle claim.
 */
export const projectCommitLockCloseCommitLockDescriptor: (descriptor: number, failure: projectCommitLockCommitLockDescriptorFailure | undefined, lockPath: string) => void = (
  descriptor: number,
  failure: projectCommitLockCommitLockDescriptorFailure | undefined,
  lockPath: string,
): void => {
  try {
    fileSystem.closeSync(descriptor);
  } catch (closeFailure) {
    if (failure === undefined) throw closeFailure;
    throw new CommitLockDescriptorCleanupError(
      [
        ...(failure.error instanceof CommitLockDescriptorCleanupError
          ? failure.error.errors
          : [failure.error]),
        closeFailure,
      ],
      `Commit-lock descriptor cleanup failed after the read failed: ${lockPath}.`,
    );
  }
};
