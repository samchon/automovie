import { currentAutoMovieLocalProcessOwner } from "./currentAutoMovieLocalProcessOwner";
import { currentAutoMovieLocalProcessQuery } from "./currentAutoMovieLocalProcessQuery";
import { observeAutoMovieLocalProcessOwner } from "./observeAutoMovieLocalProcessOwner";
import type { IAutoMovieCommitLockOwner } from "./IAutoMovieCommitLockOwner";

/**
 * Observe one recorded local process owner against this process generation and the configured native query; only the absent result can support dead-owner reclamation.
 *
 * @evidence contracts/common.md#principled-implementation The shared process-observation contract compares host, PID and generation, preserving unknown-query and occupied-or-reused states rather than treating occupancy as identity.
 * @evidence contracts/common.md#clear-and-simple-design Delegates native platform queries to their canonical provider and supplies the current process owner, keeping filesystem locking outside this observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No age threshold, PID-only inference or platform-specific alternate owner predicate bypasses the shared process contract.
 * @evidence contracts/common.md#meaningful-documentation States the inputs and narrower absent authorization; provider failures remain represented by the observation's established unknown result.
 * @evidence contracts/performance.md#efficient-algorithms Local composition is fixed work; platform process-query cost follows the selected provider and is not represented as constant native latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses canonical current-process identity and query providers; the recorded owner's current liveness is surveyed for each call rather than cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No file or lock is acquired; native query lifetime belongs to the shared provider and the returned observation is caller-owned data.
 */
export const projectCommitLockCommitLockOwnerState: (owner: IAutoMovieCommitLockOwner) => ReturnType<typeof observeAutoMovieLocalProcessOwner> = (
  owner: IAutoMovieCommitLockOwner,
): ReturnType<typeof observeAutoMovieLocalProcessOwner> =>
  observeAutoMovieLocalProcessOwner({
    owner,
    current: currentAutoMovieLocalProcessOwner(),
    query: currentAutoMovieLocalProcessQuery(),
  });
