import type { HumanViewerAddress } from "./HumanViewerAddress";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";

/**
 * Draw a candidate's first frame. The candidate opens at whatever address the
 * host showed last, which may name a document that is not admitted yet, was
 * removed, or fails to build; that is the document's own failure, not the
 * source generation's, so it must not keep every candidate from becoming
 * ready (the whole viewer would stay not-ready over one input file). When the
 * requested address fails, the candidate draws the standard document instead
 * and reports why, and only a failure of the standard document itself fails
 * the candidate. A worker that cannot load is a generation failure and is
 * passed on unchanged.
 *
 * @evidence contracts/common.md#principled-implementation One document's refusal stays that document's error; generation readiness depends only on the generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fallback is the address default, never a document chosen by name here.
 * @evidence contracts/common.md#meaningful-documentation States why the first address may fail, the fallback and what still fails the candidate.
 */
export async function showHumanViewerFirstAddress(
  requested: HumanViewerAddress,
  show: (address: HumanViewerAddress) => Promise<void>,
  loaded: Promise<unknown>,
  report: (message: string) => void,
): Promise<void> {
  try {
    await Promise.all([show(requested), loaded]);
    return;
  } catch (error) {
    // A worker load failure fails the candidate whatever the address.
    await loaded;
    const standard = parseHumanViewerAddress("");
    if (requested.doc === standard.doc) throw error;
    report(`${requested.doc} could not be shown (${error instanceof Error ? error.message : String(error)}); ` +
      `this generation opened on ${standard.doc}`);
    await show(standard);
  }
}
