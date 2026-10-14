import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAssertPhysicalDirectoryAncestry } from "./productionProjectAssertPhysicalDirectoryAncestry";

/**
 * Recheck each physical namespace ancestry captured when this project handle opened.
 *
 * @evidence contracts/common.md#principled-implementation Existing captured directory identities are compared with fresh physical observations through the ancestry owner; the first changed or missing directory refuses the stale handle.
 * @evidence contracts/common.md#clear-and-simple-design The handle owns its captured ancestry population and this operation delegates each comparison without adding another identity representation or cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths are not accepted merely because their names remain equal; an empty capture population performs no checks and no new baseline is acquired here.
 * @evidence contracts/common.md#meaningful-documentation States captured-generation comparison and refusal; constructor capture and enclosing incarnation checks determine which namespace population must be present.
 * @evidence contracts/performance.md#efficient-algorithms Work scales with the total captured directory components across all ancestries, including native lstat/stat observations; verification stops at the first failing ancestry.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor captures are reused as expected identities while current physical observations are reacquired on every invocation; cached success cannot replace them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The handle owns and retains the original ancestry arrays; this function adds only transient stat/key data, with no new collection, descriptor or task.
 */
export function productionProjectAssertProductionNamespaceIdentities(state: AutoMovieProductionProjectState): void {
    for (const ancestry of state.productionNamespaceAncestries_)
        productionProjectAssertPhysicalDirectoryAncestry(ancestry);
}
