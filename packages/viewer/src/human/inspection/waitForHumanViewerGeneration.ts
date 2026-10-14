/**
 * Wait until the resident page can draw again, polling its explicit readiness predicate. Transport failure and source cancellation belong to the caller; elapsed time cannot make an unfinished generation ready.
 *
 * @evidence contracts/common.md#principled-implementation Polls the caller's explicit ready predicate with its supplied pause; only predicate success ends the wait.
 * @evidence contracts/common.md#clear-and-simple-design Readiness meaning and transport/source cancellation stay with the caller rather than another generation-state service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed time never declares readiness and the helper adds no arbitrary success timeout or renderer claim.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies explicit readiness, caller cancellation ownership and elapsed-time limitations.
 * @evidence contracts/performance.md#efficient-algorithms For P polls it performs P predicate checks and at most P awaited pauses, with one pending pause and no accumulated polling history.
 * @evidence contracts/performance.md#reuse-equivalent-work A changing ready predicate is read each poll; a prior generation's true value is not cached across a new call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one supplied pause is awaited at a time, the total wait has no independent deadline and timer/cancellation lifetime belongs to the supplied pause owner.
 */
export async function waitForHumanViewerGeneration(
  ready: () => boolean,
  pause: (ms: number) => Promise<void>,
  stepMs: number = 100,
): Promise<void> {
  while (!ready())
    await pause(stepMs);
}
