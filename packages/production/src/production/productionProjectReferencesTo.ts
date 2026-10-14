
import { type IAutoMovieModelLodRecipe, type IAutoMovieShotParticipant, IAutoMovieDesignTarget } from "@automovie/interface";
import { acceptanceAddressesShot } from "./acceptanceAddressesShot";
import { compareCodeUnits } from "./contentIdentity";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { productionProjectShotUsesLandmark } from "./productionProjectShotUsesLandmark";

/**
 * List direct design references that can refuse erasure.
 *
 * @evidence contracts/common.md#principled-implementation Admitted graph records expose LOD, formation participation, acceptance addresses and landmark predicates; this reports direct authored relations rather than transitive reachability.
 * @evidence contracts/common.md#clear-and-simple-design Target-family branches own refusal addresses; acceptance and landmark helpers own their typed projections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Film acceptance is not treated as every shot reference, and acceptance deletion has no outgoing refusal list here.
 * @evidence contracts/common.md#meaningful-documentation Sorted labels identify dependent designs; this function neither deletes them nor validates all graph relationships.
 * @evidence contracts/performance.md#efficient-algorithms Scans the relevant records and nested LOD/participant/predicate/criterion populations, then sorts R labels with O(R log R) comparisons and text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads current graph relations per attempt; no dependency cache is retained across edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns R result strings; predicate and criterion temporaries release after each helper call, with no handle or task.
 */
export function productionProjectReferencesTo(graph: IAutoMovieProductionDesignGraph, target: IAutoMovieDesignTarget): string[] {
    const references: string[] = [];
    if (target.kind === "production") {
        for (const id of graph.shots.keys())
            references.push(`shot:${id}`);
        for (const [id, acceptance] of graph.acceptance)
            if (acceptance.target.kind === "film")
                references.push(`acceptance:${id}`);
    }
    else if (target.kind === "model") {
        for (const [id, model] of graph.models)
            if (id !== target.id && model.lod.some((lod: IAutoMovieModelLodRecipe): boolean => lod.recipe === target.id))
                references.push(`model:${id}`);
        for (const [id, formation] of graph.formations)
            if (formation.modelRecipe === target.id)
                references.push(`formation:${id}`);
    }
    else if (target.kind === "formation") {
        for (const [id, shot] of graph.shots)
            if (shot.participants.some((participant: IAutoMovieShotParticipant): boolean => participant.kind === "formation" && participant.id === target.id))
                references.push(`shot:${id}`);
    }
    else if (target.kind === "shot") {
        for (const [id, acceptance] of graph.acceptance)
            if (acceptanceAddressesShot(acceptance, target.id))
                references.push(`acceptance:${id}`);
    }
    else if (target.kind === "world") {
        for (const [id, shot] of graph.shots)
            if (productionProjectShotUsesLandmark(shot))
                references.push(`shot:${id}`);
    }
    return references.sort(compareCodeUnits);
}
