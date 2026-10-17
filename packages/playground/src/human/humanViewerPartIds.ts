import type { IAutoMovieHumanConstructionNet } from "@automovie/human";

import type { HumanViewerPage } from "./HumanViewerPage";

/** Enumerate skin part ids and the currently selected independent construction groups.
 * Construction ids remain separate because a design group is not a skin mesh.
 *
 * @evidence contracts/common.md#principled-implementation Uses actual current model and selected net ids; bilateral construction groups include their side.
 * @evidence contracts/common.md#clear-and-simple-design One list drives visible checkboxes and their all/none operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction groups are not mapped to unrelated skin ids or claimed as generated surfaces.
 * @evidence contracts/common.md#meaningful-documentation Explains the distinction between skin and construction ids.
 * @evidence contracts/performance.md#efficient-algorithms A Set deduplicates one scan of model parts and selected nets.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each UI rebuild reads the current selection; no cross-edit result is retained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns only strings and retains no viewer resources.
 */
export function humanViewerPartIds(page: HumanViewerPage): string[] {
  const ids: Set<string> = new Set(
    page.current.model.parts.map((part: { id: string }): string => part.id),
  );
  for (const net of page.curveDisplay?.nets ?? page.nets ?? [])
    ids.add(humanViewerPartIds.construction(net));
  return [...ids];
}

/** Expose actual construction-group naming alongside the page part-id enumeration.
 *
 * @evidence contracts/common.md#principled-implementation The namespace construction function derives construction:part:side from the actual net, using midline only for a null side.
 * @evidence contracts/common.md#clear-and-simple-design Keeps construction naming with the shared list consumed by display filtering and the visible part checkboxes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prefix distinguishes construction groups from skin meshes and does not imply a source mesh index.
 * @evidence contracts/common.md#meaningful-documentation States stable part/side meaning and independence from display sample density.
 * @evidence contracts/performance.md#efficient-algorithms Naming formats fixed fields; the accompanying exported enumeration scans actual parts and selected nets once.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-edit catalogue is retained; callers enumerate the current page and net references.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only strings and a temporary id Set are created; scene resources remain with the display owner.
 */
export namespace humanViewerPartIds {
  /** Name an actual construction part/side independently from its curve samples.
   *
   */

  export function construction(net: IAutoMovieHumanConstructionNet): string {
    return `construction:${net.part}:${net.side ?? "midline"}`;
  }
}
