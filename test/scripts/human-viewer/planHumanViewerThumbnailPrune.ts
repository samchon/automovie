/**
 * The directory name that holds every thumbnail of one display source
 * revision, the first sixteen hex digits of its digest.
 */
export const humanViewerThumbnailDirectory = (revision: string): string =>
  revision.slice(0, 16);

/**
 * Choose which revision directories of the thumbnail folder to delete when
 * the display source changes. The current revision's directory and the newest
 * older one stay: the older one lets a gallery keep showing last-good pictures,
 * dimmed, until the new revision draws its own. Every other directory and every
 * flat file an earlier layout wrote can never be shown again and only costs
 * disk. Names only: the caller deletes, and nothing outside the thumbnail
 * folder is named. The numerical result cache is keyed by document and is
 * never pruned here.
 *
 * @evidence contracts/common.md#principled-implementation A revision-keyed directory makes staleness a name comparison and recency a modification-time order, so the kept set is exact.
 * @evidence contracts/common.md#clear-and-simple-design One pure planner owns the retention rule and the directory naming.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Removes only derived pictures of superseded revisions, never source, basis or the numerical cache.
 * @evidence contracts/common.md#meaningful-documentation States what is kept, why, and what is never touched.
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
