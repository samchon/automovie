import type { HumanViewerCatalogue } from "./HumanViewerCatalogue.js";

/**
 * Read only the selected document's descriptor and domain verdict. A pending
 * input waits for its own sidecars and admission; unrelated published states
 * and candidate files never become prerequisites for this show. Explicit full
 * catalogue settlement remains a separate inspection operation. A page whose
 * loaded source differs from the server never waits for that newer source's
 * admissions: catalogue admission keeps its own already displayed generation
 * or refuses a known newer descriptor, including a pending candidate. This
 * read never treats that candidate as drawable or loads its newer runtime.
 *
 * @evidence contracts/common.md#principled-implementation A pending document is awaited until its owner decides, never refused as unknown while undecided.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One settled read replaces any polling or delay.
 * @evidence contracts/common.md#meaningful-documentation States when the settled catalogue is read and what a missing document then means.
 * @evidence contracts/common.md#clear-and-simple-design One selected-document read chooses immediate published generation or the existing settled-document endpoint; full-catalogue settlement stays separate.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Returns the original selected document's descriptor/verdict with its source revision for the loaded page's admission decision.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates a newer catalogue receipt from the checked runtime required to evaluate it.
 */
export async function readHumanViewerShowCatalogue(
  doc: string,
  loadedRevision: string,
): Promise<HumanViewerCatalogue> {
  const published = (await (
    await fetch("/docs?doc=" + encodeURIComponent(doc))
  ).json()) as HumanViewerCatalogue;
  if (
    published.revision !== loadedRevision ||
    published.documents.some((entry) => entry.id === doc) ||
    !published.rejected.some((entry) => entry.pending)
  )
    return published;
  return (await (
    await fetch("/docs?settled=1&doc=" + encodeURIComponent(doc))
  ).json()) as HumanViewerCatalogue;
}
