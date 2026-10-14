import { IAutoMovieBeatEndState, IAutoMovieReviewNote, IAutoMovieScene, IAutoMovieScript, IAutoMovieShot } from "@automovie/interface";
import { IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import { shotIdOf } from "./shotKey";
import { autoMovieProjectValidateScriptSlice } from "./autoMovieProjectValidateScriptSlice";
import { autoMovieProjectValidateNotesSlice } from "./autoMovieProjectValidateNotesSlice";
import { autoMovieProjectValidateShotSlice } from "./autoMovieProjectValidateShotSlice";
import { autoMovieProjectValidateBeatEndSlice } from "./autoMovieProjectValidateBeatEndSlice";
import { autoMovieProjectValidateProjectValue } from "./autoMovieProjectValidateProjectValue";
import { autoMovieProjectReadValidatedJson } from "./autoMovieProjectReadValidatedJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Refresh resident project authority and read script, scenes, shots, beat ends and notes in their existing order. Optional script absence returns null and absent note bytes yield an empty list; keyed records must match decoded filenames and their supplied validators. Returned records belong to the caller, while separately guarded reads remain sequential observations rather than an atomic snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Root fencing and resident revision/manifest refresh precede keyed identity and semantic slice admission; optional absence stays null or empty.
 * @evidence contracts/common.md#clear-and-simple-design One resident read assembles script, scenes, shots, beat ends and notes; film admission is separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential observations are not an atomic snapshot; malformed present data refuses rather than becoming invented content.
 * @evidence contracts/common.md#meaningful-documentation States optional-state meaning, validated keyed identities and caller-owned collections.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes across F files, sorts filenames and includes nested validators; output storage follows admitted content.
 * @evidence contracts/performance.md#reuse-equivalent-work Each file is parsed once in this assembly; current refreshes do not reuse pathname-only read verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts namespace retirement; failed native release can retain fences, while returned trees have no local byte/population cap.
 */
export function autoMovieProjectStoredSlate(_project: IAutoMovieProjectState): Omit<IAutoMovieLegacyWritableSlate, "film"> {
    return _project.withRootNamespace((): {
        script: IAutoMovieScript | null;
        scenes: IAutoMovieScene[];
        shots: IAutoMovieShot[];
        beatEnds: IAutoMovieBeatEndState[];
        notes: IAutoMovieReviewNote[];
    } => {
        _project.synchronizeResidentState();
        const script: IAutoMovieScript | null = autoMovieProjectReadValidatedJson<IAutoMovieScript>(_project.root, _project.slicePath("script.json"), autoMovieProjectValidateScriptSlice);
        const scenes: IAutoMovieScene[] = _project.readStagedScenes();
        const shots: IAutoMovieShot[] = _project.readKeyedSlices<IAutoMovieShot>("shots", {
            label: "shot id",
            expected: shotIdOf,
            actual: (shot: IAutoMovieShot): string => shot.id,
        }, (file: string, shot: IAutoMovieShot): void => autoMovieProjectValidateProjectValue(file, shot, autoMovieProjectValidateShotSlice));
        return {
            script,
            scenes,
            shots,
            beatEnds: _project.readKeyedSlices<IAutoMovieBeatEndState>("beatEnds", {
                label: "beat end",
                expected: (beat: string): string => beat,
                actual: (end: IAutoMovieBeatEndState): string => end.beat,
            }, (file: string, beatEnd: IAutoMovieBeatEndState): void => autoMovieProjectValidateProjectValue(file, beatEnd, autoMovieProjectValidateBeatEndSlice)),
            notes: autoMovieProjectReadValidatedJson<IAutoMovieReviewNote[]>(_project.root, _project.slicePath("notes.json"), autoMovieProjectValidateNotesSlice) ?? [],
        };
    });
}
