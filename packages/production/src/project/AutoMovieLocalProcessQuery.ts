



/**
 * Signal-zero observation capability used by local lock-owner resolution.
 *
 * @evidence contracts/common.md#principled-implementation The callable signature permits only signal zero, which observes process occupancy instead of sending a terminating signal.
 * @evidence contracts/common.md#clear-and-simple-design The current-query reader supplies native process.kill or an explicit invocation dependency to the owner observer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No success value proves process-generation identity; the observer interprets success and platform error codes conservatively.
 * @evidence contracts/common.md#meaningful-documentation States the queried PID, non-terminating signal and unknown native return value.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The signature executes nothing; native process-table cost belongs to its supplied implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each observation needs current occupancy and this signature promises no cached response.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The capability holds no handle by definition; an injected implementation owns any resources it acquires.
 */
export type AutoMovieLocalProcessQuery = (pid: number, signal: 0) => unknown;
