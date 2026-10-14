import { IAutoMovieDesignTarget } from "@automovie/interface";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

/**
 * Read one exact design address from an admitted graph.
 *
 * @evidence contracts/common.md#principled-implementation The closed target selects a singleton or exact Map key; absent keyed values become null.
 * @evidence contracts/common.md#clear-and-simple-design Lookup stays separate from schema admission and deletion reference checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate spelling or fallback artifact is substituted for absence.
 * @evidence contracts/common.md#meaningful-documentation The returned unknown value is borrowed and may be null; lookup proves neither currentness nor downstream validity.
 * @evidence contracts/performance.md#efficient-algorithms One fixed dispatch and Map lookup does not scan the graph; key processing depends on the addressed string.
 * @evidence contracts/performance.md#reuse-equivalent-work The graph is the caller's current observation; no stale design result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No copy, descriptor or task is acquired; the result borrows the graph value.
 */
export function productionProjectDesignFromGraph(graph: IAutoMovieProductionDesignGraph, target: IAutoMovieDesignTarget): unknown {
    switch (target.kind) {
        case "production":
            return graph.production;
        case "model":
            return graph.models.get(target.id) ?? null;
        case "world":
            return graph.world;
        case "formation":
            return graph.formations.get(target.id) ?? null;
        case "shot":
            return graph.shots.get(target.id) ?? null;
        case "acceptance":
            return graph.acceptance.get(target.id) ?? null;
    }
}
