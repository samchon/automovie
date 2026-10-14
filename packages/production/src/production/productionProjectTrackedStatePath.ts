import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Resolve an address inside the selected production's tracked state root after current-incarnation admission.
 *
 * @evidence contracts/common.md#principled-implementation Current root/namespace/incarnation guards precede native path resolution under productionStateRoot; the shared lexical resolver refuses escape while retaining its root-inclusive and contained-absolute semantics.
 * @evidence contracts/common.md#clear-and-simple-design One operation supplies state addresses to readers and diagnostic/publication owners; resident file shape and content validation stay with the consuming operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stale incarnation or escaping address gets a fallback path; returning the namespace root itself is not an admission that it is a readable state file.
 * @evidence contracts/common.md#meaningful-documentation Defines selected-root resolution, incarnation refusal and the path-only result; this function creates no target and reads no target payload.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes the full incarnation guard's registry/lineage and captured-ancestry observations, then path-length resolution; moving those checks to a callee does not make this a filesystem-free operation.
 * @evidence contracts/performance.md#reuse-equivalent-work The handle's captured identities remain guard premises; each call reacquires current records and physical observations instead of trusting an earlier resolved path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded readers own descriptor release; temporary records and pathname data are local, and only the resolved string escapes without a retained task or new namespace cache.
 */
export function productionProjectTrackedStatePath(state: AutoMovieProductionProjectState, relativePath: string): string {
    productionProjectAssertIncarnation(state);
    return resolveInside(state.productionStateRoot, relativePath);
}
