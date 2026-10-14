/**
 * Block the current Node thread for a retry's requested millisecond timeout.
 *
 * Synchronous constructor and publication callers cannot proceed before the attempted step completes. The retry owner supplies positive finite durations. Host scheduling determines actual elapsed time; this helper does not impose a wall-clock deadline.
 *
 * @evidence contracts/common.md#principled-implementation Atomics.wait on a fresh zero-valued shared cell requests a timed synchronous pause under the Node host contract.
 * @evidence contracts/common.md#clear-and-simple-design The pause remains separate from filesystem retries and preserves their synchronous call boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No busy loop or async promise disguises the blocking effect; actual scheduling is not a certified timeout bound.
 * @evidence contracts/common.md#meaningful-documentation Gives millisecond units, retry-owner duration premise and current-thread blocking semantics.
 * @evidence contracts/performance.md#efficient-algorithms One four-byte shared cell and one native timed wait use constant storage; elapsed work includes the requested pause and host scheduling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each retry needs its own wait; reusing a prior pause would change effect ordering.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shared cell and view are call-local and collectible after the wait; no timer or persistent waiter escapes.
 */
export function productionProjectPauseAtomicRetry(milliseconds: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}
