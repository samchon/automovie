import type { IHumanViewerThumbnailDisk } from "./IHumanViewerThumbnailDisk.js";
import { humanViewerThumbnailDirectory } from "./humanViewerThumbnailDirectory.js";
import { planHumanViewerThumbnailPrune } from "./planHumanViewerThumbnailPrune.js";

/**
 * The disk folder of display thumbnails, one directory per source revision. A thumbnail missing from the current revision can use the same basename from the newest older directory that contains it, or null when none does. The capture route marks that fallback stale instead of caching it as current. Successful pruning keeps the current revision and the older directory with the latest modification time; it does not prove that directory has every gallery image. Paths derive from the supplied thumbnail folder and disk-reported directory names; the numerical result cache is not touched.
 *
 * @evidence contracts/common.md#principled-implementation The canonical revision-directory planner selects pruning targets and stale lookup searches older directories by actual disk times for the same thumbnail basename.
 * @evidence contracts/common.md#clear-and-simple-design Prune and stale are independent disk-policy adapters over one folder and the shared revision naming function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An older picture remains a stale path rather than being relabeled current, and only directory names reported by the thumbnail disk enter prune selection.
 * @evidence contracts/common.md#meaningful-documentation The comment defines current-plus-previous retention, stale gallery behavior and separation from numerical result caches.
 * @evidence contracts/performance.md#efficient-algorithms Pruning delegates one directory scan to its planner; stale lookup sorts revision directories in O(n log n) work and probes thumbnail existence until the newest match.
 * @evidence contracts/performance.md#reuse-equivalent-work Stale lookup reuses the same named image only as an explicitly older revision fallback; disk listings are reread rather than assumed current across writes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful pruning retains the current and newest older revision directories; failed deletion can leave older disk content and this adapter retains no in-memory listing or image data.
 */
export function createHumanViewerThumbnailStore(
  disk: IHumanViewerThumbnailDisk,
  folder: string,
  join: (...parts: string[]) => string,
): {
  prune: (revision: string) => void;
  stale: (file: string, revision: string) => string | null;
} {
  return {
    /** Remove every revision directory except the current one and the newest older one. */
    prune: (revision: string): void => {
      for (const stale of planHumanViewerThumbnailPrune(
        disk.directories(folder),
        revision,
      ))
        disk.remove(join(folder, stale));
    },

    /**
     * The same thumbnail from the newest older revision, or null when none has it. `file` is the current revision's path of the thumbnail.
     */
    stale: (file: string, revision: string): string | null => {
      const name: string = file.split(/[/\\]/).at(-1)!;
      const current: string = humanViewerThumbnailDirectory(revision);
      const older: string | undefined = disk
        .directories(folder)
        .filter(
          (
            entry: ReturnType<IHumanViewerThumbnailDisk["directories"]>[number],
          ): boolean => entry.name !== current,
        )
        .sort(
          (
            a: ReturnType<IHumanViewerThumbnailDisk["directories"]>[number],
            b: ReturnType<IHumanViewerThumbnailDisk["directories"]>[number],
          ): number => b.mtimeMs - a.mtimeMs,
        )
        .map(
          (
            entry: ReturnType<IHumanViewerThumbnailDisk["directories"]>[number],
          ): string => join(folder, entry.name, name),
        )
        .find((candidate: string): boolean => disk.exists(candidate));
      return older ?? null;
    },
  };
}
