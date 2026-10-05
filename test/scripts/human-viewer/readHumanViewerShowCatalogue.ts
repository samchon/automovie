import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";

/**
 * The catalogue a show reads. The published catalogue answers at once; when
 * it lacks the document while some input is still undecided, the document
 * may be among those awaiting admission, so the settled catalogue is read
 * instead, which answers only after the pending admissions have their
 * verdicts. A document missing from a catalogue with nothing undecided is
 * unknown, and the show refuses it.
 *
 * @evidence contracts/common.md#principled-implementation A pending document is awaited until its owner decides, never refused as unknown while undecided.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One settled read replaces any polling or delay.
 * @evidence contracts/common.md#meaningful-documentation States when the settled catalogue is read and what a missing document then means.
 */
export async function readHumanViewerShowCatalogue(doc: string): Promise<HumanViewerCatalogue> {
  const published = (await (await fetch("/docs")).json()) as HumanViewerCatalogue;
  if (published.documents.some((entry) => entry.id === doc) ||
      !published.rejected.some((entry) => entry.pending))
    return published;
  return (await (await fetch("/docs?settled=1")).json()) as HumanViewerCatalogue;
}
