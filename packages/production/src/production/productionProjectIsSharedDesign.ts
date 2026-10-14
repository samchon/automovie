import { IAutoMovieDesignTarget } from "@automovie/interface";

/**
 * Classify model, world and formation as shared-root design addresses.
 *
 * @evidence contracts/common.md#principled-implementation The closed design union maps only those three families to shared ownership; production, shot and acceptance remain production-scoped.
 * @evidence contracts/common.md#clear-and-simple-design A single predicate serves mutation locking and audit-root choice; path/identity admission remains with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The family policy is a supported namespace distinction, not a fixture or proof of physical ownership.
 * @evidence contracts/common.md#meaningful-documentation True requests shared mutation coordination; it performs no lock acquisition or filesystem validation.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of discriminant comparisons uses constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The current target is checked directly with no cache or cross-operation effect sharing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean returns; no state, handle or task is retained.
 */
export function productionProjectIsSharedDesign(target: IAutoMovieDesignTarget): boolean {
    return target.kind === "model" ||
        target.kind === "world" ||
        target.kind === "formation";
}
