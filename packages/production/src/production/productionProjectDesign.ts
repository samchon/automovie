import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import type { IAutoMovieDesignTarget } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectGraph } from "./productionProjectGraph";

/**
 * Select one optional artifact from a freshly admitted complete design graph.
 *
 * @evidence contracts/common.md#principled-implementation The closed target-kind union selects production/world fields or a keyed model/formation/shot/acceptance lookup after graph refresh and schema-admitted resident loading; an absent supported artifact returns null.
 * @evidence contracts/common.md#clear-and-simple-design Target projection consumes the existing graph owner so design APIs share complete schema and namespace admission instead of inventing a separate single-record reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No requested target bypasses malformed unrelated graph residents; the closed kind premise is required and an unknown runtime kind has no fallback artifact.
 * @evidence contracts/common.md#meaningful-documentation States complete fresh graph acquisition, supported target optionality and unknown-valued return; resident/schema errors propagate and this projection does not judge cross-record semantic validity or freeze later state.
 * @evidence contracts/performance.md#efficient-algorithms Dominant work is full graph refresh and all resident JSON/directory reads, including each keyed population's existing quadratic case scan; the final fixed branch/map lookup does not turn acquisition into a constant-time single-artifact read.
 * @evidence contracts/performance.md#reuse-equivalent-work One loaded graph supplies the requested projection within this call; independent requests reacquire the graph and no previous target or revision result is cached as byte equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Full graph records/maps are temporary until the selected record transfers to the caller; guarded readers own cleanup and this selector retains no graph, descriptor, byte inventory or task.
 */
export function productionProjectDesign(state: AutoMovieProductionProjectState, target: IAutoMovieDesignTarget): unknown {
    const graph: IAutoMovieProductionDesignGraph = productionProjectGraph(state);
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
