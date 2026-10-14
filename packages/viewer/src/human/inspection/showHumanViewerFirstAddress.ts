import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Draw a candidate's first frame. The candidate opens at whatever address the host showed last, which may name a document that is not admitted yet, was removed, or fails to build; that is the document's own failure, not the source generation's, so it must not keep every candidate from becoming ready (the whole viewer would stay not-ready over one input file). When the requested address fails, the candidate draws the standard document instead and reports why, and only a failure of the standard document itself fails the candidate. A worker that cannot load is a generation failure and is passed on unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Waits for both requested show and worker loading to actually settle, propagates worker-load failure first and uses the existing standard fallback only for a failed nonstandard document.
 * @evidence contracts/common.md#clear-and-simple-design Document failure remains separate from source-worker readiness while one helper owns the candidate's initial selection and fallback report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source load failure never becomes a successful fallback, and an early rejection does not release the candidate while the other task is still using its stage.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains requested-versus-standard failure, worker failure precedence and actual promise settlement before candidate retirement, without independent OS/GPU release proof.
 * @evidence contracts/performance.md#efficient-algorithms The two initial tasks run concurrently and at most one fallback show follows; retained coordination is fixed size while actual build/draw work stays with show.
 * @evidence contracts/performance.md#reuse-equivalent-work The originally requested show is not repeated after success; fallback is a distinct standard-document effect and does not reuse a failed displayed state as ready.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Both initial tasks settle before return/refusal, so a borrowed stage cannot be retired through Promise.all's early rejection; the helper owns no worker or GPU handle.
 */
export async function showHumanViewerFirstAddress(
  requested: HumanViewerAddress,
  show: (address: HumanViewerAddress) => Promise<void>,
  loaded: Promise<unknown>,
  report: (message: string) => void,
  standard: HumanViewerAddress,
): Promise<void> {
  const outcomes: [
    PromiseSettledResult<unknown>,
    PromiseSettledResult<unknown>,
  ] = await Promise.allSettled([
    Promise.resolve().then((): Promise<void> => show(requested)),
    loaded,
  ]);
  // Both tasks settle before the candidate or its borrowed stage can retire.
  if (outcomes[1].status === "rejected") throw outcomes[1].reason;
  if (outcomes[0].status === "rejected") {
    const error: unknown = outcomes[0].reason;
    if (requested.doc === standard.doc) throw error;
    report(
      `${requested.doc} could not be shown (${error instanceof Error ? error.message : String(error)}); ` +
        `this generation is retrying ${standard.doc}`,
    );
    await show(standard);
  }
}
