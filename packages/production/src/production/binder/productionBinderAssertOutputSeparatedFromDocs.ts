import { productionBinderContains } from "./productionBinderContains";

/**
 * Refuse output overlap in either direction with the authored docs tree.
 *
 * @evidence contracts/common.md#principled-implementation Refuses either root-inclusive containment direction so an output may neither sit under docs nor be an ancestor of docs; callers apply it to lexical and observed prospective/final physical addresses.
 * @evidence contracts/common.md#clear-and-simple-design One overlap rule serves construction and publication without relocating author-owned docs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality refuses as overlap, and no caller/title chooses a bypass; repeated endpoint checks do not guarantee absence of intervening namespace races.
 * @evidence contracts/common.md#meaningful-documentation Defines two-way refusal and the caller's lexical/physical address premise, not an independent filesystem identity fence.
 * @evidence contracts/performance.md#efficient-algorithms Runs up to two native path-relative computations proportional to path lengths; it enumerates no directory or byte population.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor and bind reuse the same logical overlap rule while reacquiring physical operands when their operation requires them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path temporaries are local and no descriptor, retained path cache or task is created.
 */
export function productionBinderAssertOutputSeparatedFromDocs(output: string, docs: string): void {
    if (productionBinderContains(output, docs) || productionBinderContains(docs, output))
        throw new Error(`${output}: the output directory must remain separate from the authored docs tree.`);
}
