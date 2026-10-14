
import { type IAutoMovieSceneBeatCoverage, type IAutoMovieSceneEvidence, type IAutoMovieScreenplayScene, type IAutoMovieTreatmentBeat, type IAutoMovieTreatmentSequence, IAutoMovieScreenplayIndex } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

/**
 * Find treatment sequences whose beats cover scenes evidenced by affected shots.
 *
 * @evidence contracts/common.md#principled-implementation Shot evidence scene IDs join active screenplay scene coverage to each sequence's exact beat text; missing screenplay or an empty shot set yields no sequences.
 * @evidence contracts/common.md#clear-and-simple-design One affected-scene set supports the sequence fold without changing authored ordering before final ID sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inactive scenes and unrelated beat text do not count; no sequence is inferred from a shot ID alone.
 * @evidence contracts/common.md#meaningful-documentation Returns sorted sequence IDs, not a proof of narrative acceptance or generated output currentness.
 * @evidence contracts/performance.md#efficient-algorithms Copies affected evidence, then builds each sequence's beat set and scans scenes/coverage until a match; worst-case work includes the sequence-by-scene product plus beat/coverage text and output sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work Affected scene membership is reused within one call; per-sequence beat sets are rebuilt and no retained screenplay index is claimed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Evidence temporaries and beat sets release locally; returned IDs are caller-owned and grow with matching sequences.
 */
export function productionProjectAffectedSequenceIds(graph: IAutoMovieProductionDesignGraph, screenplay: IAutoMovieScreenplayIndex | null, affectedShots: ReadonlySet<string>): string[] {
    if (screenplay === null || affectedShots.size === 0)
        return [];
    const affectedScenes: Set<string> = new Set([...affectedShots].flatMap((id: string): string[] => graph.shots.get(id)?.evidence?.map((evidence: IAutoMovieSceneEvidence): string => evidence.scene) ?? []));
    return screenplay.treatment.sequences
        .filter((sequence: IAutoMovieTreatmentSequence): boolean => {
        const beats: Set<string> = new Set(sequence.beats.map((beat: IAutoMovieTreatmentBeat): string => beat.text));
        return screenplay.screenplay.scenes.some((scene: IAutoMovieScreenplayScene): boolean => scene.status === "active" &&
            affectedScenes.has(scene.id) &&
            scene.covers.some((coverage: IAutoMovieSceneBeatCoverage): boolean => beats.has(coverage.beat)));
    })
        .map((sequence: IAutoMovieTreatmentSequence): string => sequence.id)
        .sort(compareCodeUnits);
}
