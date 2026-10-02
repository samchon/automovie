/**
 * Wait until the resident page can draw again, polling every `stepMs` for at
 * most `limitMs`, and then once more so a generation that just became ready
 * has finished publishing. Returns when ready or when the limit passes; the
 * caller's retry then runs on whatever generation is serving, and an error
 * there surfaces unchanged. The wait ends at the limit even if the source
 * keeps changing, so no request waits forever.
 *
 * @evidence contracts/common.md#principled-implementation A bounded poll of an explicit readiness predicate, with one trailing step for publication.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the wait for the retry across generations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Waits on actual readiness and never on a fixed delay alone.
 * @evidence contracts/common.md#meaningful-documentation States the polling rule, the bound and the trailing step.
 */
export async function waitForHumanViewerGeneration(
  ready: () => boolean,
  pause: (ms: number) => Promise<void>,
  limitMs = 30000,
  stepMs = 100,
): Promise<void> {
  for (let waited = 0; waited < limitMs && !ready(); waited += stepMs)
    await pause(stepMs);
  await pause(stepMs);
}
