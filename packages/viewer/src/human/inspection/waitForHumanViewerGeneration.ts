/**
 * Wait until the resident page can draw again, polling its explicit readiness
 * predicate. Transport failure and source cancellation belong to the caller;
 * elapsed time cannot make an unfinished generation ready.
 *
 * @evidence contracts/common.md#principled-implementation Completion follows the actual readiness predicate rather than elapsed time.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the wait for the retry across generations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Waits on actual readiness and never on a fixed delay alone.
 * @evidence contracts/common.md#meaningful-documentation States polling and caller-owned failure semantics.
 */
export async function waitForHumanViewerGeneration(
  ready: () => boolean,
  pause: (ms: number) => Promise<void>,
  stepMs = 100,
): Promise<void> {
  while (!ready())
    await pause(stepMs);
}
