import type { IHumanViewerThumbnailDisk } from "./createHumanViewerThumbnailStore";

/**
 * The thumbnail store's disk over Node's filesystem. A missing folder has no
 * directories; every other call acts on exactly the path it is given.
 */
export function createNodeHumanViewerThumbnailDisk(
  fs: {
    existsSync(path: string): boolean;
    readdirSync(path: string, options: { withFileTypes: true }): { name: string }[];
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
