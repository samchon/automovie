import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAssertRealAncestorInside } from "./productionProjectAssertRealAncestorInside";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Resolve an owned directory address and fence its nearest existing ancestor under the admitted physical project root.
 *
 * @evidence contracts/common.md#principled-implementation Project-root generation is checked first, then native lexical containment and the existing ancestor realpath fence; the returned value stays the resolved requested address even when its tail does not yet exist.
 * @evidence contracts/common.md#clear-and-simple-design This directory-resolution boundary serves constructor and output/source-root operations; stricter complete physical-ancestry admission stays with the operations that create or read those namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing tail cannot hide an existing ancestor escaping the project; realpath containment can admit an internal alias, so this function does not claim to refuse every in-project linked ancestor.
 * @evidence contracts/common.md#meaningful-documentation States missing-tail resolution, nearest-ancestor fencing and the separate complete-ancestry obligation, preserving native and outside-root refusals.
 * @evidence contracts/performance.md#efficient-algorithms Work scales with path text and the number of missing ancestor levels climbed before one realpath observation; no descendant directory population or file bytes are scanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every invocation checks current root/ancestor observations; retaining a resolved pathname does not prove its physical ancestor remains current.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only pathname/stat temporaries are acquired and the resolved string transfers to the caller; no directory handle, cache or task is retained.
 */
export function productionProjectResolveOwnedDirectory(state: AutoMovieProductionProjectState, relativePath: string): string {
    productionProjectAssertProjectRootIdentity(state);
    const resolved: string = resolveInside(state.root, relativePath);
    productionProjectAssertRealAncestorInside(state.rootReal, resolved);
    return resolved;
}
