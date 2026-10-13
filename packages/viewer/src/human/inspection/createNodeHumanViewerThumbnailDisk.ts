import type { IHumanViewerThumbnailDisk } from "./IHumanViewerThumbnailDisk.js";

/**
 * The thumbnail store's disk over Node's filesystem. A missing folder has no
 * directories; every other call acts on exactly the path it is given.
 *
 * @evidence contracts/common.md#principled-implementation Maps the thumbnail owner's explicit paths to injected filesystem listing, modification time, existence and removal operations.
 * @evidence contracts/common.md#clear-and-simple-design One filesystem adapter supplies the store protocol; directory selection and pruning remain with its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no subject-specific path, alternate cache or implicit directory enumeration beyond the folder the owner supplies.
 * @evidence contracts/common.md#meaningful-documentation States the missing-folder result and exact-path boundary; this adapter does not certify ownership of caller paths.
 */
export function createNodeHumanViewerThumbnailDisk(
  fs: {
    existsSync(path: string): boolean;
    readdirSync(
      path: string,
      options: { withFileTypes: true },
    ): { name: string }[];
    statSync(path: string): { mtimeMs: number };
    rmSync(path: string, options: { recursive: true; force: true }): void;
  },
  join: (...parts: string[]) => string,
): IHumanViewerThumbnailDisk {
  return {
    directories: (folder) =>
      fs.existsSync(folder)
        ? fs.readdirSync(folder, { withFileTypes: true }).map((entry) => ({
            name: entry.name,
            mtimeMs: fs.statSync(join(folder, entry.name)).mtimeMs,
          }))
        : [],
    exists: (file) => fs.existsSync(file),
    remove: (target) => fs.rmSync(target, { recursive: true, force: true }),
  };
}
