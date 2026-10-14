import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectAssertWritable } from "./productionProjectAssertWritable";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Create an owned directory after writable/root/ancestor admission and recheck it.
 *
 * @evidence contracts/common.md#principled-implementation Preserves writable and root checks, admits physical ancestors with missing descendants allowed, recursively creates, then requires resident physical ancestors and the same root identity.
 * @evidence contracts/common.md#clear-and-simple-design Coordinates the existing filesystem creation with its before/after fence, leaving ancestor traversal and root identity comparison to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Creation is never substituted for read-only verification, and a post-create refusal does not pretend that already created directories were rolled back.
 * @evidence contracts/common.md#meaningful-documentation States recursive creation and the asymmetric pre/post missing-directory policy; refusal can occur after observable directory creation.
 * @evidence contracts/performance.md#efficient-algorithms Traverses directory ancestry before and after mkdir and performs root stats; path depth and missing directories drive work rather than project design/media populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Rechecks current ancestors for each creation because filesystem replacement can invalidate an earlier admission; it shares only the opening's expected root identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No descriptor or task is retained by synchronous mkdir/stat calls; successful created directories remain repository-owned even if a later check fails.
 */
export function productionProjectMkdirOwned(state: AutoMovieProductionProjectState, directory: string): void {
    productionProjectAssertWritable(state);
    productionProjectAssertProjectRootIdentity(state);
    productionProjectAssertPhysicalDirectoryAncestors(state.rootReal, directory, true);
    fileSystem.mkdirSync(directory, {
        recursive: true,
    });
    productionProjectAssertPhysicalDirectoryAncestors(state.rootReal, directory, false);
    productionProjectAssertProjectRootIdentity(state);
}
