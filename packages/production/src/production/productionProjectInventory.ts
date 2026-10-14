import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { IAutoMovieProductionDesignInventory } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectGraph } from "./productionProjectGraph";

/**
 * List admitted design addresses and optional production/world presence.
 *
 * @evidence contracts/common.md#principled-implementation Reads the guarded typed graph and projects its map keys without changing ordering; inventory identifies authored records rather than proving graph completeness or renderability.
 * @evidence contracts/common.md#clear-and-simple-design Graph acquisition owns filesystem/schema admission while this operation creates the compact address-only view used by project consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not synthesize missing designs or infer their presence from generated files; graph read refusals propagate.
 * @evidence contracts/common.md#meaningful-documentation Presence booleans represent non-null admitted production/world records and arrays preserve the graph's current model/formation/shot/acceptance iteration order.
 * @evidence contracts/performance.md#efficient-algorithms Includes full graph acquisition and an O(N) key copy for N admitted keyed designs; filesystem parsing dominates rather than the final projection alone.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses one graph for all six result fields, while later inventory calls reread designs because a revision number alone does not freeze their resident bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local graph values become unreachable on return and only key arrays transfer to the caller; delegated readers close handles and no graph cache is added.
 */
export function productionProjectInventory(state: AutoMovieProductionProjectState): IAutoMovieProductionDesignInventory {
    const graph: IAutoMovieProductionDesignGraph = productionProjectGraph(state);
    return {
        production: graph.production !== null,
        models: [...graph.models.keys()],
        world: graph.world !== null,
        formations: [...graph.formations.keys()],
        shots: [...graph.shots.keys()],
        acceptance: [...graph.acceptance.keys()],
    };
}
