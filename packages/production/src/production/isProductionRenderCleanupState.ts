import type { AutoMovieProductionRenderArtifactState } from "./AutoMovieProductionRenderArtifactState";

/**
 * Narrow the supported render-artifact state vocabulary.
 *
 * @evidence contracts/common.md#principled-implementation Exact literal comparison recognizes the eight declared states rather than inferring state from path or bytes.
 * @evidence contracts/common.md#clear-and-simple-design Planner and materialization advice share one state owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown values return false and cannot become absence or a stale default through this predicate.
 * @evidence contracts/common.md#meaningful-documentation States the closed vocabulary check, without proving any physical observation.
 * @evidence contracts/performance.md#efficient-algorithms At most eight comparisons take fixed local work.
 * @evidence contracts/performance.md#reuse-equivalent-work One predicate identity supplies each caller without caching verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean transfers; no payload or native resource is retained.
 */
export function isProductionRenderCleanupState(value: unknown): value is AutoMovieProductionRenderArtifactState {
    return value === "absent" ||
        value === "current" ||
        value === "verified-stale" ||
        value === "integrity-failed" ||
        value === "unsafe-locator" ||
        value === "foreign-generation" ||
        value === "unavailable" ||
        value === "observation-conflict";
}
