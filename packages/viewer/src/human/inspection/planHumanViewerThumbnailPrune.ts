import { humanViewerThumbnailDirectory } from "./humanViewerThumbnailDirectory.js";

/**
 * Choose which revision directories of the thumbnail folder to delete when the display source changes. The current revision's directory and the newest older one stay: the older one lets a gallery keep showing last-good pictures, dimmed, until the new revision draws its own. Other supplied directories become deletion candidates; flat files are outside this directory-only list. Names only: the caller deletes, and nothing outside the thumbnail folder is named. The numerical result cache is keyed by document and is never pruned here.
 *
 * @evidence contracts/common.md#principled-implementation Current revision naming and newest older-directory modification time select the retained thumbnail generations.
 * @evidence contracts/common.md#clear-and-simple-design Filtering/sorting supplied directory names returns deletion candidates while disk mutation stays with the store.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only supplied directories are selected; flat files and numerical caches are outside this plan's ownership.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines current-plus-prior directory retention and names-only separation from physical deletion.
 * @evidence contracts/performance.md#efficient-algorithms Sorting older directories costs O(n log n) followed by a linear candidate filter.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical revision-prefix naming is shared with lookup and directory-time facts are supplied anew each pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only deletion names are returned; actual removal and failed-disk retention remain with the caller.
 */
export function planHumanViewerThumbnailPrune(
  entries: readonly { name: string; mtimeMs: number }[],
  revision: string,
): string[] {
  const keep: string = humanViewerThumbnailDirectory(revision);
  const previous: (typeof entries)[number] | undefined = entries
    .filter((entry: (typeof entries)[number]): boolean => entry.name !== keep)
    .sort(
      (a: (typeof entries)[number], b: (typeof entries)[number]): number =>
        b.mtimeMs - a.mtimeMs,
    )[0];
  return entries
    .filter(
      (entry: (typeof entries)[number]): boolean =>
        entry.name !== keep && entry !== previous,
    )
    .map((entry: (typeof entries)[number]): string => entry.name);
}
