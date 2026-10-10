import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";

/**
 * Read only the selected document's descriptor and domain verdict. A pending
 * input waits for its own sidecars and admission; unrelated published states
 * and candidate files never become prerequisites for this show. Explicit full
 * catalogue settlement remains a separate inspection operation.
 *
 * @evidence contracts/common.md#principled-implementation A pending document is awaited until its owner decides, never refused as unknown while undecided.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One settled read replaces any polling or delay.
 * @evidence contracts/common.md#meaningful-documentation States when the settled catalogue is read and what a missing document then means.
 */
export async function readHumanViewerShowCatalogue(
  doc: string,
): Promise<HumanViewerCatalogue> {
  const published = (await (
    await fetch("/docs?doc=" + encodeURIComponent(doc))
  ).json()) as HumanViewerCatalogue;
  if (
    published.documents.some((entry) => entry.id === doc) ||
    !published.rejected.some((entry) => entry.pending)
  )
    return published;
  return (await (
    await fetch("/docs?settled=1&doc=" + encodeURIComponent(doc))
  ).json()) as HumanViewerCatalogue;
}
