import { type Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";

/**
 * Treat ENOENT and ENOTDIR as an absent entry for the parent-resolution walk; every other native error remains visible to the caller.
 *
 * @evidence contracts/common.md#principled-implementation Both missing-name and file-ancestor errors represent inability to reach the requested entry, allowing the parent walk to name the actual malformed ancestor.
 * @evidence contracts/common.md#clear-and-simple-design Centralizes only the supported absence classification and leaves physical suitability to the callers using the returned stat.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Permission, I/O and unrelated errno values are not converted into absence or creation authority.
 * @evidence contracts/common.md#meaningful-documentation Names the two admitted absence codes and propagation of all other failures.
 * @evidence contracts/performance.md#efficient-algorithms One lstat and fixed errno classification drive cost, excluding filesystem latency; returned stat storage is fixed-shaped.
 * @evidence contracts/performance.md#reuse-equivalent-work No stat result is cached across calls because parent and root entries can change during acquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a stat value or null without acquiring a descriptor, lock or retained task.
 */
export const productionRootNamespaceLstatOrNull: (file: string) => Stats | null = (file: string): Stats | null => {
  try {
    return fileSystem.lstatSync(file);
  } catch (error) {
    // Missing names and nondirectory ancestors both prevent reaching this entry;
    // the parent walk and physical-directory callers decide the resulting refusal.
    const code: string | undefined = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return null;
    throw error;
  }
};
