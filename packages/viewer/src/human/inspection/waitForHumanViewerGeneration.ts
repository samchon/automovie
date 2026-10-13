/**
 * Wait until the resident page can draw again, polling its explicit readiness
 * predicate. Transport failure and source cancellation belong to the caller;
 * elapsed time cannot make an unfinished generation ready.
 */
export async function waitForHumanViewerGeneration(
  ready: () => boolean,
  pause: (ms: number) => Promise<void>,
  stepMs = 100,
): Promise<void> {
  while (!ready())
    await pause(stepMs);
}
