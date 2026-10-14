import type { IHumanViewerThumbnailDisk } from "./IHumanViewerThumbnailDisk.js";

/**
 * The thumbnail store's disk over Node's filesystem. A missing folder has no directories; every other call acts on exactly the path it is given. Regular files and symlinks are not returned as revision directories.
 *
 * @evidence contracts/common.md#principled-implementation Actual directory entries alone become revision candidates with their disk modification time; removal and existence forward to the supplied filesystem.
 * @evidence contracts/common.md#clear-and-simple-design Three filesystem adapters implement the thumbnail disk contract without another path or pruning owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dirent.isDirectory filters regular files and symlinks so an unrelated file is not misclassified as a removable revision directory.
 * @evidence contracts/common.md#meaningful-documentation Documentation states missing-folder behavior, directory-only enumeration and exact-path forwarding for other calls.
 * @evidence contracts/performance.md#efficient-algorithms Enumeration visits each entry once and stats only real directories; existence/removal costs remain with Node filesystem operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pruning owner needs current directory times, so this adapter does not reuse cached listings across disk changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Listing allocates one result per actual directory and retains none after the call; recursive removal is delegated to the supplied synchronous filesystem owner.
 */
export function createNodeHumanViewerThumbnailDisk(
  fs: {
    existsSync(path: string): boolean;
    readdirSync(
      path: string,
      options: { withFileTypes: true },
    ): { name: string; isDirectory(): boolean }[];
    statSync(path: string): { mtimeMs: number };
    rmSync(path: string, options: { recursive: true; force: true }): void;
  },
  join: (...parts: string[]) => string,
): IHumanViewerThumbnailDisk {
  return {
    directories: (folder: string): ReturnType<IHumanViewerThumbnailDisk["directories"]> =>
      fs.existsSync(folder)
        ? fs.readdirSync(folder, { withFileTypes: true }).filter((entry: { name: string; isDirectory(): boolean }): boolean => entry.isDirectory()).map((entry: { name: string }): { name: string; mtimeMs: number } => ({
            name: entry.name,
            mtimeMs: fs.statSync(join(folder, entry.name)).mtimeMs,
          }))
        : [],
    exists: (file: string): boolean => fs.existsSync(file),
    remove: (target: string): void => fs.rmSync(target, { recursive: true, force: true }),
  };
}
