import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";

/**
 * Refuse mutation through a project opened read-only.
 *
 * @evidence contracts/common.md#principled-implementation The constructor's readOnly_ flag is the mutation capability boundary; a true flag throws with the selected production and a false flag returns without a filesystem effect.
 * @evidence contracts/common.md#clear-and-simple-design This operation owns capability refusal alone; namespace, revision and publication guards remain with their existing callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No production, pathname or expected result bypasses the flag, and no read-only request is converted into a writable handle.
 * @evidence contracts/common.md#meaningful-documentation States the read-only failure and lack of a mutation effect; successful return is not a physical-ownership or revision verdict.
 * @evidence contracts/performance.md#efficient-algorithms One boolean branch uses constant work; refusal allocates an error message proportional to the production ID.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current borrowed state flag is read on every invocation; this guard coordinates no completed result or in-flight effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the state; this operation retains no handle, buffer, cache or task on return or refusal.
 */
export function productionProjectAssertWritable(state: AutoMovieProductionProjectState): void {
    if (state.readOnly_)
        throw new Error(`Production "${state.productionId}" was opened read-only and cannot mutate project state.`);
}
