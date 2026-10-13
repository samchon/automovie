import type { Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";

/**
 * Only native ENOENT maps to null; every other lstat failure propagates unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Only native ENOENT maps to null; every other lstat failure propagates unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Physical readers and directory/leaf admission share absence interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Permission, I/O and malformed capability failures are not treated as missing files; callers rely on errno-bearing Node-compatible errors.
 * @evidence contracts/common.md#meaningful-documentation States null-on-absence and unchanged non-ENOENT failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms One metadata operation dominates work with constant wrapper storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Every invocation observes resident metadata rather than caching pathname existence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned Stats object or null belongs to the caller; no handle or task is retained.
 */
export const derivedArtifactLstatOrNull: (file: string) => Stats | null = (file: string): Stats | null => {
    try {
        return fileSystem.lstatSync(file);
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
            return null;
        throw error;
    }
};
