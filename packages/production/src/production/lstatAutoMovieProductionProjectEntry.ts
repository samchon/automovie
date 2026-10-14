import type { Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";

/**
 * Observe one native entry without following its final link, admitting absence only.
 *
 * @evidence contracts/common.md#principled-implementation Delegates lstatSync and maps only an object failure with code ENOENT to null; project read, path and atomic helpers distinguish missing entries from links and every other storage failure.
 * @evidence contracts/common.md#clear-and-simple-design Owns the common absence observation, while callers choose whether missing is valid and how to reject nonregular or replaced paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Message text and non-Error values do not invent absence; errors with other codes propagate unchanged, and lstat does not silently follow a final symlink.
 * @evidence contracts/common.md#meaningful-documentation Defines null, final-link behavior and unchanged error propagation; one stat observation cannot prove later currentness.
 * @evidence contracts/performance.md#efficient-algorithms Performs one native lstat with host filesystem cost; the catch uses constant field checks and traverses no directory or payload population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fresh observations are required by read/commit fences, so no path cache assumes an earlier missing or physical generation remains equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the stat snapshot or null; this synchronous observation opens no persistent descriptor and retains no path store or task.
 */
export function lstatAutoMovieProductionProjectEntry(file: string): Stats | null {
  try { return fileSystem.lstatSync(file); }
  catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}
