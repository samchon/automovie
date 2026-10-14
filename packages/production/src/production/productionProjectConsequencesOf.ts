
import { type IAutoMovieAcceptanceScenario, type IAutoMovieShotParticipant, IAutoMovieDesignTarget, IAutoMovieScreenplayIndex } from "@automovie/interface";
import { acceptanceAddressesShot } from "./acceptanceAddressesShot";
import { acceptanceCriterionShots } from "./acceptanceCriterionShots";
import { autoMovieModelRecipeDependsOn } from "./autoMovieModelRecipeDependsOn";
import { compareCodeUnits } from "./contentIdentity";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { AutoMovieProductionProjectMutationConsequenceReviewTarget } from "./AutoMovieProductionProjectMutationConsequenceReviewTarget";
import { IAutoMovieProductionProjectMutationConsequences } from "./IAutoMovieProductionProjectMutationConsequences";
import { productionProjectAffectedSequenceIds } from "./productionProjectAffectedSequenceIds";
import { productionProjectReviewConsequenceKey } from "./productionProjectReviewConsequenceKey";

/**
 * Predict review, render and generated-path consequences of one design target.
 *
 * @evidence contracts/common.md#principled-implementation Current graph relations and screenplay scene coverage determine affected addresses; acceptance edits omit stale renders and deterministic delivery omits rendition reviews. The fallback film label covers absent production metadata.
 * @evidence contracts/common.md#clear-and-simple-design Sets track affected formations/shots and a keyed map deduplicates review addresses; graph admission and persistence remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject review or physical removal is fabricated; removedGenerated copies the entire supplied path list, including duplicates.
 * @evidence contracts/common.md#meaningful-documentation The result is a sorted prediction used by setters and erasure; it neither mutates reviews nor deletes output bytes.
 * @evidence contracts/performance.md#efficient-algorithms Includes repeated fresh reachable-LOD traversals for models, formations and actor participants, shot/acceptance scans, nested sequence-scene coverage checks and sorting review/path populations; no blanket linear bound or measured speedup is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work Sets/map share discoveries within this call, but dependency traversals are repeated per query and no cross-edit graph cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local sets, map and traversal temporaries release; the caller owns result arrays bounded by graph, screenplay and supplied paths, without a fixed cap.
 */
export function productionProjectConsequencesOf(graph: IAutoMovieProductionDesignGraph, target: IAutoMovieDesignTarget, generatedPaths: readonly string[], screenplay: IAutoMovieScreenplayIndex | null): IAutoMovieProductionProjectMutationConsequences {
    const staleReviews: Map<string, AutoMovieProductionProjectMutationConsequenceReviewTarget> = new Map<string, AutoMovieProductionProjectMutationConsequenceReviewTarget>();
    const addReview: (review: AutoMovieProductionProjectMutationConsequenceReviewTarget) => void = (review: AutoMovieProductionProjectMutationConsequenceReviewTarget): void => {
        staleReviews.set(productionProjectReviewConsequenceKey(review), review);
    };
    addReview({ kind: "design", design: target });
    const affectedFormations: Set<string> = new Set<string>();
    const affectedShots: Set<string> = new Set<string>();
    if (target.kind === "model") {
        addReview({ kind: "asset", id: target.id });
        for (const [id] of graph.models)
            if (autoMovieModelRecipeDependsOn(graph.models, id, target.id)) {
                addReview({
                    kind: "design",
                    design: { kind: "model", id },
                });
                addReview({ kind: "asset", id });
            }
        for (const [id, formation] of graph.formations)
            if (autoMovieModelRecipeDependsOn(graph.models, formation.modelRecipe, target.id)) {
                affectedFormations.add(id);
                addReview({
                    kind: "design",
                    design: { kind: "formation", id },
                });
            }
    }
    if (target.kind === "formation")
        affectedFormations.add(target.id);
    if (target.kind === "production" || target.kind === "world")
        for (const id of graph.shots.keys()) {
            affectedShots.add(id);
            addReview({
                kind: "design",
                design: { kind: "shot", id },
            });
        }
    for (const [id, shot] of graph.shots)
        if ((target.kind === "model" &&
            shot.participants.some((participant: IAutoMovieShotParticipant): boolean => participant.kind === "actor" &&
                autoMovieModelRecipeDependsOn(graph.models, participant.id, target.id))) ||
            shot.participants.some((participant: IAutoMovieShotParticipant): boolean => participant.kind === "formation" &&
                affectedFormations.has(participant.id))) {
            affectedShots.add(id);
            addReview({
                kind: "design",
                design: { kind: "shot", id },
            });
        }
    if (target.kind === "shot") {
        affectedShots.add(target.id);
        const source: string | undefined = graph.shots.get(target.id)?.source.module;
        if (source !== undefined)
            addReview({ kind: "source", path: source });
        for (const [id, acceptance] of graph.acceptance)
            if (acceptanceAddressesShot(acceptance, target.id))
                addReview({
                    kind: "design",
                    design: { kind: "acceptance", id },
                });
    }
    if (target.kind === "acceptance") {
        const acceptance: IAutoMovieAcceptanceScenario | undefined = graph.acceptance.get(target.id);
        if (acceptance?.target.kind === "shot")
            affectedShots.add(acceptance.target.id);
        if (acceptance !== undefined)
            for (const shot of acceptanceCriterionShots(acceptance))
                affectedShots.add(shot);
    }
    if (target.kind === "production")
        for (const [id, acceptance] of graph.acceptance)
            if (acceptance.target.kind === "film")
                addReview({
                    kind: "design",
                    design: { kind: "acceptance", id },
                });
    for (const id of affectedShots) {
        addReview({ kind: "shot", id });
        if (graph.production?.visualDelivery !== "deterministic")
            addReview({ kind: "rendition", id });
    }
    for (const id of productionProjectAffectedSequenceIds(graph, screenplay, affectedShots))
        addReview({ kind: "sequence", id });
    addReview({
        kind: "film",
        id: graph.production?.id ?? "film",
    });
    const staleRenders: string[] = target.kind === "acceptance"
        ? []
        : [
            ...[...affectedShots]
                .sort(compareCodeUnits)
                .map((id: string): string => `shot:${id}`),
            ...(affectedShots.size === 0
                ? []
                : [`film:${graph.production?.id ?? "film"}`]),
        ];
    return {
        staleReviews: [...staleReviews.values()].sort((left: AutoMovieProductionProjectMutationConsequenceReviewTarget, right: AutoMovieProductionProjectMutationConsequenceReviewTarget): number => compareCodeUnits(productionProjectReviewConsequenceKey(left), productionProjectReviewConsequenceKey(right))),
        staleRenders,
        removedGenerated: [...generatedPaths].sort(compareCodeUnits),
    };
}
