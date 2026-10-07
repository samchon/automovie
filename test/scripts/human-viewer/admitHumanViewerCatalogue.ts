import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";

/**
 * Choose the catalogue a page draws from after reading the server's current
 * one. Catalogue revision also identifies the worker modules and basis the
 * page loaded; a newer revision's catalogue cannot replace those resident
 * resources, so the page keeps its own and draws its last good generation,
 * which the server labels stale. Inside the page's own revision the refreshed
 * catalogue wins, so inputs, sidecars and generation views republished
 * without a source change are drawn at once. A document only the newer
 * generation knows is refused with the generation-change reason, which the
 * server retries on the settled generation instead of answering it as unknown.
 *
 * @evidence contracts/common.md#principled-implementation Revision equality preserves the loaded worker and basis authority before replacing document inventory.
 * @evidence contracts/common.md#clear-and-simple-design One admission function owns catalogue replacement while the host owns source generation changes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never relabels old modules as a newer generation; a document of the newer generation waits for it.
 * @evidence contracts/common.md#meaningful-documentation States what revision equality protects, the stale fallback and the retryable refusal.
 */
export function admitHumanViewerCatalogue(
  current: HumanViewerCatalogue,
  refreshed: HumanViewerCatalogue,
  doc: string,
): HumanViewerCatalogue {
  if (refreshed.revision === current.revision) return refreshed;
  if (
    !current.documents.some((entry) => entry.id === doc) &&
    refreshed.documents.some((entry) => entry.id === doc)
  )
    throw new Error(
      "The document inventory belongs to a newer source generation",
    );
  return current;
}
