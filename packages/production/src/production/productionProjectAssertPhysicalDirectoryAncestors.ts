import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import path from "node:path";
import type { Stats } from "node:fs";

/**
 * Reject linked or non-directory descendants along an admitted owned path.
 *
 * The caller supplies a physical project root and lexical containment. With allowMissingTail the first absent entry ends the walk, permitting later creation; otherwise absence throws. Existing internal aliases are rejected even when realpath would remain in-project. Root-equal input visits no descendant, so this helper does not independently revalidate the root or lock later state.
 *
 * @evidence contracts/common.md#principled-implementation Platform-relative segments and final-entry lstat admit only physical descendant directories, with an explicit first-missing-tail creation policy.
 * @evidence contracts/common.md#clear-and-simple-design Descendant shape admission stays separate from root identity, real containment and captured-identity rechecks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts In-project symlinks/junctions are not accepted as equivalent namespaces; caller containment and root premises are not supplied by this walk.
 * @evidence contracts/common.md#meaningful-documentation Explains missing-tail policy, internal-alias refusal, root-equal behavior and observation lifetime.
 * @evidence contracts/performance.md#efficient-algorithms At most D descendant lstats and native path constructions dominate; no child inventory or file bytes are read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Creation/read fences require current path observations rather than a cached absence or directory shape.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only current path/stat values are temporary; the function retains no snapshot, directory handle or watcher.
 */
export function productionProjectAssertPhysicalDirectoryAncestors(projectRootReal: string, directory: string, allowMissingTail: boolean): void {
    const resolved: string = path.resolve(directory);
    const relative: string = path.relative(projectRootReal, resolved);
    let current: string = projectRootReal;
    for (const segment of relative === "" ? [] : relative.split(path.sep)) {
        current = path.join(current, segment);
        const linked: Stats | null = lstatOrNull(current);
        if (linked === null) {
            if (allowMissingTail)
                return;
            throw new Error(`Owned directory "${current}" does not exist.`);
        }
        if (linked.isSymbolicLink() || linked.isDirectory() === false)
            throw new Error(`Owned directory "${current}" is not a physical directory. Replace every symlink or junction with a project-owned directory.`);
    }
}
