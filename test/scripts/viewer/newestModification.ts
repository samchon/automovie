import fs from "node:fs";
import path from "node:path";

/**
 * The newest modification time of any file under a directory, milliseconds
 * since the epoch, or `null` when the tree holds no file.
 *
 * The viewer's freshness check compares this against the browser build, so it
 * reads the file system's own times and follows nothing but real directory
 * entries. The file system is a parameter so that the walk is exercised
 * against an in-memory tree.
 *
 * @param directory Root of the tree.
 * @param system The two calls it needs, defaulting to `node:fs`.
 */
export function newestModification(
  directory: string,
  system: {
    readdirSync: (
      directory: string,
    ) => { name: string; isDirectory(): boolean }[];
    statMtimeMs: (file: string) => number;
  } = {
    readdirSync: (dir) => fs.readdirSync(dir, { withFileTypes: true }),
    statMtimeMs: (file) => fs.statSync(file).mtimeMs,
  },
): number | null {
  let newest: number | null = null;
  for (const entry of system.readdirSync(directory)) {
    const child = path.join(directory, entry.name);
    const time = entry.isDirectory()
      ? newestModification(child, system)
      : system.statMtimeMs(child);
    if (time !== null && (newest === null || time > newest)) newest = time;
  }
  return newest;
}
