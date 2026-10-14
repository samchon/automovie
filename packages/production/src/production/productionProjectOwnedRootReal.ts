import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionProjectAssertRealAncestorInside } from "./productionProjectAssertRealAncestorInside";
import type { Stats } from "node:fs";

/**
 * Resolve a currently physical owned root through the real-containment guard.
 *
 * @evidence contracts/common.md#principled-implementation Native lstat first refuses a linked/non-directory root, then the shared real-ancestor guard resolves a containing physical address inside the admitted project root.
 * @evidence contracts/common.md#clear-and-simple-design Root shape and real containment are checked here; ancestry/current-generation fencing remains with project read and commit owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native absence/errors propagate without a fallback root, and these sequential observations do not guarantee race-free continuing identity.
 * @evidence contracts/common.md#meaningful-documentation Documents linked/non-directory refusal, returned real address and separate captured-identity obligations.
 * @evidence contracts/performance.md#efficient-algorithms One lstat plus the delegated existing-ancestor/realpath walk dominates; no target payload or directory inventory is read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each read or commit scope needs current root observations rather than a previous realpath cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the real-path string escapes; stat/walk temporaries expire and the caller owns any later namespace lease.
 */
export function productionProjectOwnedRootReal(projectRootReal: string, directory: string): string {
    const linked: Stats = fileSystem.lstatSync(directory);
    if (linked.isSymbolicLink() || linked.isDirectory() === false)
        throw new Error(`Owned root "${directory}" was replaced by a symlink, junction, or non-directory. Restore its physical project directory.`);
    return productionProjectAssertRealAncestorInside(projectRootReal, directory);
}
