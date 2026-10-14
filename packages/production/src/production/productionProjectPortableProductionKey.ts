import { productionProjectEncodeId } from "./productionProjectEncodeId";

/**
 * Produce the encoded lowercase collision key used by portable production registries.
 *
 * @evidence contracts/common.md#principled-implementation Applies canonical id segment encoding before lowercase folding, matching the encoded namespace representation that case-insensitive hosts compare; it leaves the original authored spelling unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Registry validation and registration planning compare a compact key while preserving the separately stored production id.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A collision key does not validate all production-id spelling rules, prove Unicode equivalence or admit duplicate registered identities; callers own their validation and duplicate refusal.
 * @evidence contracts/common.md#meaningful-documentation Names the exact encode-then-lowercase order and its role as a comparison key rather than the public production id.
 * @evidence contracts/performance.md#efficient-algorithms Encoding and lowercase conversion cost time/space proportional to id and encoded segment length, with collection comparison kept outside this scalar helper.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure comparison-key formatting has no acquired effect to share; registry validators store their keys within one validation pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one key string and retains no registry population, handle, lock or running task.
 */
export function productionProjectPortableProductionKey(id: string): string {
    return productionProjectEncodeId(id).toLowerCase();
}
