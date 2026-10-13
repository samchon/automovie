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
