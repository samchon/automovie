import {
  humanViewerThumbnailDirectory,
  planHumanViewerThumbnailPrune,
} from "./planHumanViewerThumbnailPrune";

/** The filesystem the store needs, so a test can stand in for the disk. */
export interface IHumanViewerThumbnailDisk {
  /** The revision directories of the thumbnail folder with their modification times. */
  directories(folder: string): { name: string; mtimeMs: number }[];

  /** Whether a file exists. */
  exists(file: string): boolean;

  /** Delete a directory tree. */
  remove(path: string): void;
}

/**
 * The disk folder of display thumbnails, one directory per source revision.
 * A thumbnail the current revision has not drawn yet is answered with the
 * same picture from the newest older revision (`stale`), so a gallery never
 * empties when a source edit starts a new revision, and the caller marks that
 * answer stale so it is dimmed and never cached as current. Pruning keeps the
 * current revision and that one previous revision and removes the rest, since
 * only these can still be shown. Nothing outside the thumbnail folder is read
 * or removed, and the numerical result cache is not touched.
 *
 * @evidence contracts/common.md#principled-implementation The previous revision is the newest older directory by modification time, which is the last revision that drew pictures.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the folder policy; the host supplies the disk and decides what to answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale pictures are labelled stale and never relabelled as current.
 * @evidence contracts/common.md#meaningful-documentation States the retention rule, the stale answer and what is never touched.
 */
export function createHumanViewerThumbnailStore(
  disk: IHumanViewerThumbnailDisk,
  folder: string,
  join: (...parts: string[]) => string,
) {
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
     * The same thumbnail from the newest older revision, or null when none has
     * it. `file` is the current revision's path of the thumbnail.
     */
    stale: (file: string, revision: string): string | null => {
      const name = file.split(/[/\\]/).at(-1)!;
      const current = humanViewerThumbnailDirectory(revision);
      const older = disk
        .directories(folder)
        .filter((entry) => entry.name !== current)
        .sort((a, b) => b.mtimeMs - a.mtimeMs)
        .map((entry) => join(folder, entry.name, name))
        .find((candidate) => disk.exists(candidate));
      return older ?? null;
    },
  };
}
