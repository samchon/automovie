

const waitBuffer: Int32Array<SharedArrayBuffer> = new Int32Array(
  new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
);

/**
 * Block this synchronous acquisition on one shared wait buffer for the requested milliseconds; the surrounding owner still decides deadline and retries.
 *
 * @evidence contracts/common.md#principled-implementation Atomics.wait provides a synchronous timed pause on a SharedArrayBuffer cell, matching the synchronous lock API rather than scheduling detached retry work.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the timed pause; acquisition determines contention handling, retry spacing and termination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No busy-spin or fixture-sensitive delay is used, but the operation blocks the invoking thread and depends on Atomics.wait support.
 * @evidence contracts/common.md#meaningful-documentation States requested millisecond units, synchronous blocking and the separate deadline owner.
 * @evidence contracts/performance.md#efficient-algorithms Application work and buffer storage are constant-sized; elapsed wait is host-scheduled and is not a measured performance improvement.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses one Int32Array/SharedArrayBuffer for this module, without caching or suppressing any acquisition attempt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The one-cell buffer remains for the module's lifetime; each wait ends on native timeout/return and creates no timer or detached task.
 */
export const projectCommitLockWaitForRelease: (ms: number) => void = (ms: number): void => {
  Atomics.wait(waitBuffer, 0, 0, ms);
};
