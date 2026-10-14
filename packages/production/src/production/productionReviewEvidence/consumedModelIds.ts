import { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { compareCodeUnits } from "../contentIdentity";
import type { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";

/**
 * Return sorted existing model identities actually reached by contract actors/formations or compiled shot model lists, closed under model recipe LOD references. Missing model/formation references are omitted here for their owning graph validation to diagnose; the whole materialized catalogue is not treated as staged.
 *
 * @evidence contracts/common.md#principled-implementation A visited Set and recursive DFS follow existing recipes' LOD edges, entering a model before its children so cycles terminate; contract participants and each compiled shot's model list provide roots, then code-unit sorting fixes output order.
 * @evidence contracts/common.md#clear-and-simple-design Consumption discovery owns the denominator for asset review, while design admission owns dangling references and semantic validity; the helper starts no renderer or materializer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unused recipe becomes a review obligation solely because the catalogue contains it. Missing references do not create placeholder assets, and compiled model roots cannot borrow the entire materialized inventory.
 * @evidence contracts/common.md#meaningful-documentation Documents root populations, LOD closure, missing-reference policy, deterministic order and cycle termination; recursion depth still follows the actual reachable graph and can encounter host stack limits.
 * @evidence contracts/performance.md#efficient-algorithms For P contract participants, C compiled model roots, V reached existing models and E visited LOD edges, discovery uses expected O(P+C+V+E) map/Set work plus V log V string comparisons. Duplicate missing references still cost their root/edge lookups, and recursion depth/output size have no independent quota.
 * @evidence contracts/performance.md#reuse-equivalent-work The Set marks existing models before descending, so shared LOD subgraphs and cycles are traversed once per call; no cross-build graph cache treats mutable recipe identities as unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Visited models, recursion frames up to reachable depth and the sorted output array are local, with the array transferred to the caller. Graph/compiled records remain borrowed; no handles, media buffers or running tasks are acquired.
 */
export const consumedModelIds: (graph: IAutoMovieProductionDesignGraph, compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>) => string[] = (graph: IAutoMovieProductionDesignGraph, compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>): string[] => {
    const models: Set<string> = new Set<string>();
    /**
     * Visit an existing model recipe and all reachable LOD recipes once per discovery, recording it before recursion so cycles and shared subgraphs terminate.
     *
     * Set membership short-circuits already visited models; missing recipes return without adding a placeholder, while existing LOD edges recurse through the same owner graph.
     *
     * One local DFS owns closure expansion for both participant and compiled-source roots.
     *
     * Missing references remain absent for graph validation to diagnose and no unused catalogue root is injected.
     *
     * Documents cycle/shared-subgraph behavior, existing-recipe premise and host recursion-depth limitation.
     *
     * Across discovery this fold visits V existing models and E outgoing LOD edges once, plus lookups for root/dangling occurrences; recursion stack follows reachable depth without an independent cap.
     *
     * The shared Set prevents repeat expansion of equivalent graph nodes within this call, with no cache across mutable design snapshots.
     *
     * The closure borrows the design map and owns no resources beyond invocation-local visited references and recursion frames; callers own the final sorted identity array.
     */
    const add: (id: string) => void = (id: string): void => {
        if (models.has(id))
            return;
        const recipe: ReturnType<IAutoMovieProductionDesignGraph["models"]["get"]> = graph.models.get(id);
        if (recipe === undefined)
            return;
        models.add(id);
        for (const tier of recipe.lod)
            add(tier.recipe);
    };
    for (const shot of graph.shots.values())
        for (const participant of shot.participants)
            if (participant.kind === "actor")
                add(participant.id);
            else {
                const formation: ReturnType<IAutoMovieProductionDesignGraph["formations"]["get"]> = graph.formations.get(participant.id);
                if (formation !== undefined)
                    add(formation.modelRecipe);
            }
    // Compiled shot model roots are separate from the complete materialized catalogue.
    for (const shot of compiled.values())
        for (const model of shot.models)
            add(model.id);
    return [...models].sort(compareCodeUnits);
};
