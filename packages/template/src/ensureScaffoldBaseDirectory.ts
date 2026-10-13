import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { captureScaffoldPhysicalDirectory } from "./captureScaffoldPhysicalDirectory";
import { missingPath } from "./missingPath";
import { assertScaffoldPhysicalDirectory } from "./assertScaffoldPhysicalDirectory";
import { captureEmptyScaffoldPhysicalDirectory } from "./captureEmptyScaffoldPhysicalDirectory";
import * as fs from "node:fs";
import * as path from "node:path";


/**
 * Create or capture the scaffold root, qualifying the nearest existing directory and every missing level created below it.
 *
 * The nearest existing ancestor of `directory` is captured first; each missing level is then created with a plain `mkdir`, after revalidating the level above it, and captured as a new, empty, ordinary directory. Existing ancestors above that first capture are not walked: an intermediate link in its pathname can therefore lead to the captured real directory.
 *
 * @param directory Root path, resolved against the working directory.
 * @returns The captured root.
 * @throws When an existing level is a link or not a directory, when a captured level changes during creation, when a level created here is not empty, or when an ancestor cannot be read for a reason other than being missing.
 *
 * @evidence contracts/common.md#principled-implementation The walk climbs with `path.dirname` until a level exists, which ends at the file-system root, then creates downward with non-recursive `mkdirSync`, so every created level has a captured parent; a level created by someone else between the climb and the `mkdir` makes `mkdir` throw `EEXIST` instead of being adopted.
 * @evidence contracts/common.md#clear-and-simple-design This function owns only the root and its missing ancestors; descendants of the root belong to `ensureScaffoldFileDirectory`, which checks containment against this capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only `ENOENT` and `ENOTDIR` are treated as missing levels; any other capture error propagates, and an unexpected entry in a level created here is refused rather than tolerated.
 * @evidence contracts/common.md#meaningful-documentation The comment states the climb, create-and-capture order, path resolution and refusals, and limits link admission to the first captured existing directory and newly created levels rather than every existing pathname ancestor.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the number of path levels, with a constant number of stats, opens, and real-path reads per level; `missing.unshift` is quadratic only in that depth, which is a handful of levels.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call captures the current file-system state that the caller is about to rely on, so an earlier capture is not equivalent; `publishFiles` calls this once per publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources physicalDirectoryIdentity attempts close for each capture and propagates close failures; successful captures own only strings. This walk keeps a call-local list bounded by missing path depth, while created directories intentionally remain after later refusal.
 */
export const ensureScaffoldBaseDirectory: (directory: string) => IScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const absolute: string = path.resolve(directory);
  const missing: string[] = [];
  let cursor: string = absolute;
  let ownership: IScaffoldPhysicalDirectory;
  while (true) {
    try {
      ownership = captureScaffoldPhysicalDirectory(cursor);
      break;
    } catch (error) {
      if (missingPath(error) === false) throw error;
      missing.unshift(cursor);
      const parent: string = path.dirname(cursor);
      if (parent === cursor) throw error;
      cursor = parent;
    }
  }
  for (const target of missing) {
    assertScaffoldPhysicalDirectory(ownership);
    fs.mkdirSync(target);
    assertScaffoldPhysicalDirectory(ownership);
    ownership = captureEmptyScaffoldPhysicalDirectory(target);
  }
  return ownership;
};
