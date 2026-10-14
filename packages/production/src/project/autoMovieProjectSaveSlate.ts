import { IAutoMovieBeatEndState, IAutoMovieScene, IAutoMovieShot } from "@automovie/interface";
import { IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import { beatOf } from "./shotKey";
import { autoMovieProjectStageBeatSlices } from "./autoMovieProjectStageBeatSlices";
import { autoMovieProjectAssertNoCaseCollisions } from "./autoMovieProjectAssertNoCaseCollisions";
import { autoMovieProjectWriteAtomic } from "./autoMovieProjectWriteAtomic";
import { autoMovieProjectRemoveAtomic } from "./autoMovieProjectRemoveAtomic";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Stage the complete slate before a revision-guarded reconciliation of script, film, notes and keyed scene/shot/beat-end files. The historical scene.json is removed as scenes move to keyed storage, and empty notes stage removal. Raw duplicate keys are already coalesced by Maps before case checks; this low-level write does not validate the slate and completed leaf mutations can survive a later refusal.
 *
 * @evidence contracts/common.md#principled-implementation Maps and case-folded filename guards precede serialization of every proposed slice; one guarded cycle then flushes them.
 * @evidence contracts/common.md#clear-and-simple-design Staging separates serialization from ordered mutations and historical scene-file removal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Staging failure writes nothing, but later flush failures can retain partial publication across leaves.
 * @evidence contracts/common.md#meaningful-documentation States reconciliation, stale-revision refusal, legacy scene migration and partial-flush limits.
 * @evidence contracts/performance.md#efficient-algorithms Scans keyed records, stages B bytes, lists resident directories and writes/removes their complete populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged maps/text feed this cycle; equal output never bypasses current revision and namespace checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging expires on completion and lock retirement is attempted; failed cleanup can retain fences, and completed file mutations are not rolled back.
 */
export function autoMovieProjectSaveSlate(_project: IAutoMovieProjectState, slate: IAutoMovieLegacyWritableSlate): void {
    const shots: Map<string, IAutoMovieShot> = new Map(slate.shots.map((shot: IAutoMovieShot): [
        string,
        IAutoMovieShot
    ] => [beatOf(shot.id) ?? shot.id, shot]));
    const beatEnds: Map<string, IAutoMovieBeatEndState> = new Map(slate.beatEnds.map((end: IAutoMovieBeatEndState): [
        string,
        IAutoMovieBeatEndState
    ] => [end.beat, end]));
    const scenes: Map<string, IAutoMovieScene> = new Map(slate.scenes.map((scene: IAutoMovieScene): [
        string,
        IAutoMovieScene
    ] => [scene.id, scene]));
    autoMovieProjectAssertNoCaseCollisions("scenes", scenes.keys());
    autoMovieProjectAssertNoCaseCollisions("shots", shots.keys());
    autoMovieProjectAssertNoCaseCollisions("beatEnds", beatEnds.keys());
    const staged: Array<{
        file: string;
        content: string | null;
    }> = [
        _project.stageSlice("script.json", slate.script),
        _project.stageSlice("scene.json", null),
        _project.stageSlice("film.json", slate.film),
        _project.stageSlice("notes.json", slate.notes.length === 0 ? null : slate.notes),
    ];
    const stagedScenes: Map<string, string> = autoMovieProjectStageBeatSlices(scenes);
    const stagedShots: Map<string, string> = autoMovieProjectStageBeatSlices(shots);
    const stagedBeatEnds: Map<string, string> = autoMovieProjectStageBeatSlices(beatEnds);
    _project.commitCycle((assertNamespace: () => void): void => {
        for (const { file, content } of staged)
            if (content === null) {
                autoMovieProjectRemoveAtomic(file, assertNamespace);
            }
            else
                autoMovieProjectWriteAtomic(file, content, assertNamespace);
        _project.flushBeatSlices("scenes", stagedScenes, assertNamespace);
        _project.flushBeatSlices("shots", stagedShots, assertNamespace);
        _project.flushBeatSlices("beatEnds", stagedBeatEnds, assertNamespace);
    });
}
