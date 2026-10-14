import { AutoMovieProductionProjectMutationConsequenceReviewTarget } from "./AutoMovieProductionProjectMutationConsequenceReviewTarget";
import { productionProjectTargetKey } from "./productionProjectTargetKey";

/**
 * Encode a closed mutation-review address for local deduplication.
 *
 * @evidence contracts/common.md#principled-implementation Kind prefixes preserve design, source and identifier domains; source path spelling is used exactly and design addressing delegates to targetKey.
 * @evidence contracts/common.md#clear-and-simple-design One key owner is shared by consequence accumulation, merging and sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path normalization, hashing or arbitrary-input escaping is implied; producers supply canonical typed addresses.
 * @evidence contracts/common.md#meaningful-documentation Equal producer addresses share a key, while different source spelling remains distinct.
 * @evidence contracts/performance.md#efficient-algorithms Fixed dispatch allocates a string proportional to its address text; sorting callers may recompute this key.
 * @evidence contracts/performance.md#reuse-equivalent-work The resulting key is reused only by the caller's local map; no persistent identity cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string transfers; no target, handle or task is retained.
 */
export function productionProjectReviewConsequenceKey(target: AutoMovieProductionProjectMutationConsequenceReviewTarget): string {
    if (target.kind === "design")
        return `design:${productionProjectTargetKey(target.design)}`;
    if (target.kind === "source")
        return `source:${target.path}`;
    return `${target.kind}:${target.id}`;
}
