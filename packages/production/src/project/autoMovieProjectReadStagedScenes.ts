import { IAutoMovieScene } from "@automovie/interface";
import { autoMovieProjectValidateSceneSlice } from "./autoMovieProjectValidateSceneSlice";
import { autoMovieProjectValidateProjectValue } from "./autoMovieProjectValidateProjectValue";
import { autoMovieProjectReadValidatedJson } from "./autoMovieProjectReadValidatedJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Keyed scenes are admitted first; empty keyed output alone enables validated scene.json fallback.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the actual historical layout readable until saveSlate migration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed keyed content refuses instead of triggering fallback.
 * @evidence contracts/common.md#meaningful-documentation States keyed priority and legacy one-element projection.
 * @evidence contracts/performance.md#efficient-algorithms Reads/sorts/validates F scenes and conditionally one legacy file, including nested semantics.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the acquired keyed result directly; fallback bytes are read only when needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh records transfer; readers close handles and retain no snapshot cache.
 */
export function autoMovieProjectReadStagedScenes(_project: IAutoMovieProjectState): IAutoMovieScene[] {
    const keyed: IAutoMovieScene[] = _project.readKeyedSlices<IAutoMovieScene>("scenes", {
        label: "scene id",
        expected: (fileKey: string): string => fileKey,
        actual: (scene: IAutoMovieScene): string => scene.id,
    }, (file: string, scene: IAutoMovieScene): void => autoMovieProjectValidateProjectValue(file, scene, autoMovieProjectValidateSceneSlice));
    if (keyed.length !== 0)
        return keyed;
    const legacy: IAutoMovieScene | null = autoMovieProjectReadValidatedJson<IAutoMovieScene>(_project.root, _project.slicePath("scene.json"), autoMovieProjectValidateSceneSlice);
    return legacy === null ? [] : [legacy];
}
