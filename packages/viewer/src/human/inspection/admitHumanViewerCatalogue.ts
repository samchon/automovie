import type { HumanViewerCatalogue } from "./HumanViewerCatalogue.js";

/**
 * Choose the catalogue a page draws from after reading the server's current one. Catalogue revision also identifies the worker modules and basis the page loaded; a newer revision's catalogue cannot replace those resident resources, so the page keeps its own and draws its last good generation, which the server labels stale. Inside the page's own revision the refreshed catalogue wins, so inputs, sidecars and generation views republished without a source change are drawn at once. A requested id absent from the current drawable list but present in any newer descriptor, including pending or refused entries, is refused with the generation-change reason; it may already exist among the current rejected entries. A selectable pending candidate is a known identity, not a drawable admission. The newer inventory cannot judge or replace this page's loaded generation; the host owns its replacement.
 *
 * @evidence contracts/common.md#principled-implementation Matching source revisions admit refreshed input authority; differing revisions preserve the page's loaded catalogue unless the requested id is absent from current drawable entries and present in a refreshed descriptor, which refuses as a generation change.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue selection is a pure boundary decision and leaves resident module/basis replacement to the page-generation host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A newer pending descriptor is recognized as an identity without promoting it to a drawable in the older source generation.
 * @evidence contracts/common.md#meaningful-documentation The prose documents last-good retention, same-revision input refresh and reasoned refusal for newer-generation identities.
 * @evidence contracts/performance.md#efficient-algorithms Equal revisions return in constant time; differing revisions scan current documents and, only on a miss, refreshed documents/rejections once, using O(1) auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue revision is the loaded module/basis boundary; unchanged revision permits refreshed descriptors while a changed revision cannot replace the page's cached source resources.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The selector returns an existing catalogue reference without acquiring resources; generation owners separately retire replaced page/resident state.
 */
export function admitHumanViewerCatalogue(
  current: HumanViewerCatalogue,
  refreshed: HumanViewerCatalogue,
  doc: string,
): HumanViewerCatalogue {
  if (refreshed.revision === current.revision) return refreshed;
  if (
    !current.documents.some((entry: HumanViewerCatalogue["documents"][number]): boolean => entry.id === doc) &&
    (refreshed.documents.some((entry: HumanViewerCatalogue["documents"][number]): boolean => entry.id === doc) ||
      refreshed.rejected.some((entry: HumanViewerCatalogue["rejected"][number]): boolean => entry.id === doc || entry.candidate?.id === doc))
  )
    throw new Error(
      "The document inventory belongs to a newer source generation",
    );
  return current;
}
