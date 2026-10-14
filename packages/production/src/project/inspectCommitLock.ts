import type { IAutoMovieCommitLockHolder } from "./IAutoMovieCommitLockHolder";
import { projectCommitLockInspectCommitLockSnapshot } from "./projectCommitLockInspectCommitLockSnapshot";

/**
 * Return the current holder record, including unknown reasons, or null when the resident observation establishes no lock.
 *
 * @evidence contracts/common.md#principled-implementation Projects the shared snapshot survey's holder without weakening its absent/unknown distinction or reinterpreting process occupancy as live ownership.
 * @evidence contracts/common.md#clear-and-simple-design The public holder-only API delegates identity and process evidence to the one survey used by reclamation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null is not synthesized from arbitrary read failure, and this projection never changes or removes a resident lock.
 * @evidence contracts/common.md#meaningful-documentation States holder/null purpose and preserves unknown owner state so callers can name uncertainty in refusals.
 * @evidence contracts/performance.md#efficient-algorithms Projection is constant work in addition to the token-sized read and process-query costs of the shared survey.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses one survey result within the call; repeated public inspections deliberately renew evidence instead of caching it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a value record escapes; descriptors remain with the snapshot reader and no lock lease or task is acquired by inspection.
 */
export const inspectCommitLock: (lockPath: string) => IAutoMovieCommitLockHolder | null = (
  lockPath: string,
): IAutoMovieCommitLockHolder | null =>
  projectCommitLockInspectCommitLockSnapshot(lockPath)?.holder ?? null;
