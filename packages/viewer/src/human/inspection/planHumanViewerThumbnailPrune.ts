import { humanViewerThumbnailDirectory } from "./humanViewerThumbnailDirectory.js";


/**
 * Choose which revision directories of the thumbnail folder to delete when
 * the display source changes. The current revision's directory and the newest
 * older one stay: the older one lets a gallery keep showing last-good pictures,
 * dimmed, until the new revision draws its own. Every other directory and every
 * flat file an earlier layout wrote can never be shown again and only costs
 * disk. Names only: the caller deletes, and nothing outside the thumbnail
 * folder is named. The numerical result cache is keyed by document and is
 * never pruned here.
 */
export function planHumanViewerThumbnailPrune(
  entries: readonly { name: string; mtimeMs: number }[],
  revision: string,
): string[] {
  const keep = humanViewerThumbnailDirectory(revision);
  const previous = entries
    .filter((entry) => entry.name !== keep)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  return entries
    .filter((entry) => entry.name !== keep && entry !== previous)
    .map((entry) => entry.name);
}
