import type { HumanViewerCatalogue } from "./HumanViewerCatalogue.js";

/**
 * Read only the selected document's descriptor and domain verdict. A pending input waits for its own sidecars and admission; unrelated published states and candidate files never become prerequisites for this show. Explicit full catalogue settlement remains a separate inspection operation. A page whose loaded source differs from the server never waits for that newer source's admissions: catalogue admission keeps its own already displayed generation or refuses a known newer descriptor, including a pending candidate. This read never treats that candidate as drawable or loads its newer runtime.
 *
 * @evidence contracts/common.md#principled-implementation Checks HTTP success and the catalogue's revision/documents/rejected envelope, then settles only the explicitly selected document when its current entry is pending.
 * @evidence contracts/common.md#clear-and-simple-design One inner request reader preserves the initial and settled response checks while document selection remains in the existing catalogue protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts HTTP refusal is not parsed as a successful catalogue, and an envelope check is not represented as complete nested document admission.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes selected pending admission, changed-source handling and the limited transport validation before document owners judge content.
 * @evidence contracts/performance.md#efficient-algorithms Each attempt parses catalogue bytes and scans its document/rejection arrays; at most the existing initial and selected-settlement requests are made by this call.
 * @evidence contracts/performance.md#reuse-equivalent-work The browser fetches its server catalogue using the caller's loaded revision; matching document ids alone do not permit treating a newer response as the requested ready generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call awaits requests and consumes their response bodies before retaining the decoded catalogue until return; browser fetch owns the underlying transport.
 */
export async function readHumanViewerShowCatalogue(
  doc: string,
  loadedRevision: string,
): Promise<HumanViewerCatalogue> {
  async function read(settled: boolean): Promise<HumanViewerCatalogue> {
    const response: Response = await fetch("/docs?" + (settled ? "settled=1&" : "") + "doc=" + encodeURIComponent(doc));
    if (!response.ok) throw new Error(await response.text());
    const value: unknown = await response.json();
    if (value === null || typeof value !== "object" || !("revision" in value) || typeof value.revision !== "string" ||
        !("documents" in value) || !Array.isArray(value.documents) || !("rejected" in value) || !Array.isArray(value.rejected))
      throw new Error("The server returned an incompatible document catalogue.");
    return value as HumanViewerCatalogue;
  }
  const published: HumanViewerCatalogue = await read(false);
  if (
    published.revision !== loadedRevision ||
    published.documents.some((entry: HumanViewerCatalogue["documents"][number]): boolean => entry.id === doc) ||
    !published.rejected.some((entry: HumanViewerCatalogue["rejected"][number]): boolean => entry.pending)
  )
    return published;
  return read(true);
}
