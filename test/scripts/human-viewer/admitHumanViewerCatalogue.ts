import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";

/**
 * Admit refreshed local documents only into the source generation that loaded
 * the page. Catalogue revision also identifies the worker modules and basis;
 * replacing it with a newer revision cannot replace those resident resources.
 * A new source generation is published by the host's candidate page instead.
 *
 * @evidence contracts/common.md#principled-implementation Revision equality preserves the loaded worker and basis authority before replacing document inventory.
 * @evidence contracts/common.md#clear-and-simple-design One admission function owns catalogue replacement while the host owns source generation changes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a mismatched generation rather than relabeling old modules or retrying under a different key.
 * @evidence contracts/common.md#meaningful-documentation States the resource identity the revision carries and the required candidate-page publication boundary.
 */
export function admitHumanViewerCatalogue(
  current: HumanViewerCatalogue,
  refreshed: HumanViewerCatalogue,
): HumanViewerCatalogue {
  if (refreshed.revision !== current.revision)
    throw new Error("The document inventory belongs to a newer source generation");
  return refreshed;
}
