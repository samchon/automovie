import { type Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";

/**
 * Return the current entry stat or null only for ENOENT; other failures, including a nondirectory ancestor, remain visible to the import owner.
 *
 * @evidence contracts/common.md#principled-implementation Only the supported absent-name errno is projected to null so unrelated filesystem failure cannot become optional absence.
 * @evidence contracts/common.md#clear-and-simple-design Shares one import-specific stat absence classification among physical reads, publication and rollback checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts ENOTDIR is not hidden here, and native permission/I/O errno objects propagate unchanged. The catch reads error.code directly, so arbitrary null/undefined throws from a replacement filesystem can produce a secondary property-access failure.
 * @evidence contracts/common.md#meaningful-documentation Names the sole null condition and the preserved native failure boundary.
 * @evidence contracts/performance.md#efficient-algorithms Per call performs one lstat and fixed errno comparison, with constant application bookkeeping and provider filesystem latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads current entry state each time because publication and rollback decisions cannot reuse pathname-only stat results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a stat value or null and acquires no descriptor, lease or persistent cache.
 */
export const legacyImporterLstatOrNull: (file: string) => Stats | null = (file: string): Stats | null => {
  try {
    return fileSystem.lstatSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};
