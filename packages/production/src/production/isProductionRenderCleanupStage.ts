import type { AutoMovieProductionRenderArtifactStage } from "./AutoMovieProductionRenderArtifactStage";

/**
 * Narrow the nine supported cleanup inspection stages.
 *
 * @evidence contracts/common.md#principled-implementation Exact stage literals describe which host boundary produced a finding, independent of its state/authority.
 * @evidence contracts/common.md#clear-and-simple-design One stage owner validates all candidate observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown stage values are refused by the consuming planner; stage spelling alone cannot prove capture or byte admission.
 * @evidence contracts/common.md#meaningful-documentation States the closed boundary vocabulary and absence of any host execution.
 * @evidence contracts/performance.md#efficient-algorithms At most nine comparisons take fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each observation uses the same predicate without a per-stage verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean transfers; no payload, handle or task is retained.
 */
export function isProductionRenderCleanupStage(value: unknown): value is AutoMovieProductionRenderArtifactStage {
    return value === "absence" ||
        value === "locator" ||
        value === "capture" ||
        value === "receipt" ||
        value === "inventory" ||
        value === "media" ||
        value === "currentness" ||
        value === "ownership" ||
        value === "reference";
}
