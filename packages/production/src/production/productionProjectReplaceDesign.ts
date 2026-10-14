import { IAutoMovieAcceptanceScenario, IAutoMovieDesignTarget, IAutoMovieFormationDesign, IAutoMovieModelRecipe, IAutoMovieProductionDesign, IAutoMovieShotContract, IAutoMovieWorldDesign } from "@automovie/interface";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { productionProjectReplaced } from "./productionProjectReplaced";

/**
 * Build the candidate graph for one schema-admitted design replacement.
 *
 * @evidence contracts/common.md#principled-implementation Closed target discrimination preserves every other graph member; value casts rely on the setter's successful validation of the same value and do not validate it here.
 * @evidence contracts/common.md#clear-and-simple-design Singleton replacement is a shallow graph copy; keyed families delegate ordering to replaced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No deep clone, fallback design or persistence effect is hidden in candidate construction.
 * @evidence contracts/common.md#meaningful-documentation Unchanged maps and design objects are borrowed; the returned graph is a candidate, not committed storage.
 * @evidence contracts/performance.md#efficient-algorithms Singleton work copies a fixed graph shell; keyed replacement includes copying N entries and code-unit sorting with O(N log N) comparisons plus key-text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged graph members share identity; the changed map is rebuilt per candidate and has no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new graph/map; borrowed values are not frozen or retained by this function.
 */
export function productionProjectReplaceDesign(graph: IAutoMovieProductionDesignGraph, target: IAutoMovieDesignTarget, value: unknown): IAutoMovieProductionDesignGraph {
    switch (target.kind) {
        case "production":
            return { ...graph, production: value as IAutoMovieProductionDesign };
        case "model":
            return {
                ...graph,
                models: productionProjectReplaced(graph.models, target.id, value as IAutoMovieModelRecipe),
            };
        case "world":
            return { ...graph, world: value as IAutoMovieWorldDesign };
        case "formation":
            return {
                ...graph,
                formations: productionProjectReplaced(graph.formations, target.id, value as IAutoMovieFormationDesign),
            };
        case "shot":
            return {
                ...graph,
                shots: productionProjectReplaced(graph.shots, target.id, value as IAutoMovieShotContract),
            };
        case "acceptance":
            return {
                ...graph,
                acceptance: productionProjectReplaced(graph.acceptance, target.id, value as IAutoMovieAcceptanceScenario),
            };
    }
}
