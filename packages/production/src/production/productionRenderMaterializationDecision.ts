import type { AutoMovieProductionRenderArtifactState } from "./AutoMovieProductionRenderArtifactState";
import { isProductionRenderCleanupState } from "./isProductionRenderCleanupState";

/**
 * Map an admitted artifact state to render, reuse or refusal advice.
 *
 * @evidence contracts/common.md#principled-implementation A closed state predicate precedes absent-to-render/current-to-reuse mapping; every other supported state refuses without performing host work.
 * @evidence contracts/common.md#clear-and-simple-design The state decision stays independent of GC plan construction or physical materialization, and currently has no live app caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown runtime states throw, and corruption/uncertainty is not conflated with absence that could authorize replacement.
 * @evidence contracts/common.md#meaningful-documentation Defines only advice, not mutation or successful media acquisition.
 * @evidence contracts/performance.md#efficient-algorithms A bounded state comparison chain and two branches take fixed local work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one canonical state predicate without retaining prior observation decisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a short literal transfers; no descriptor, payload or running task is acquired.
 */
export function productionRenderMaterializationDecision(state: AutoMovieProductionRenderArtifactState): "render" | "reuse" | "refuse" {
    if (isProductionRenderCleanupState(state) === false)
        throw new Error(`Render artifact state "${String(state)}" is invalid.`);
    if (state === "absent")
        return "render";
    if (state === "current")
        return "reuse";
    return "refuse";
}
