import { IAutoMovieDiagnostic, IAutoMovieFilmEdit, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate } from "@automovie/interface";
import { filmDiagnostic } from "./filmDiagnostic";
import { productionFilmAssemblyFrameTime } from "./productionFilmAssemblyFrameTime";

/**
 * Resolve world effect cue intervals against declared zone ids and film bounds, requiring unique ids, positive duration, ordered starts, and intensity in the existing zero-through-one domain. Recipe and zone references remain authored values for downstream materialization.
 *
 * @evidence contracts/common.md#principled-implementation Exact-grid conversion resolves starts and durations, then literal zone membership and interval checks validate each schema-admitted cue. The intensity comparison relies on source schema admission for numeric validity and adds no independent finite-number test.
 * @evidence contracts/common.md#clear-and-simple-design Normalization records scheduled effect metadata without instantiating effect recipes or rendering zones. The materialization owner later binds those intervals to compiled effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing zone, invalid duration, or out-of-range intensity receives a fallback value. Grid failures skip rows, while other errors can leave intermediate rows only until assembleFilm rejects the overall draft.
 * @evidence contracts/common.md#meaningful-documentation The comment gives frame units, zone ownership, ordered interval rules, the schema numeric premise, and the separation from actual effect execution.
 * @evidence contracts/performance.md#efficient-algorithms Cue processing is linear except for the existing includes lookup across zones, yielding cue-count times zone-count membership work. Id sets, output rows, and findings grow with cue population without an enforced count cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Current zone ids and canonical rate are borrowed for the whole scan. No cross-build verdict is cached because effect intervals, zone selection, authored intensity, and film bounds define validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned cue rows and appended findings become caller-owned draft data; temporary ids expire on completion. No effect instances, GPU resources, workers, or descriptors are allocated by normalization.
 */
export const productionFilmAssemblyNormalizeEffectCues: (edit: IAutoMovieFilmEdit, zones: readonly string[], frameRate: IAutoMovieProductionFrameRate, totalFrames: number, diagnostics: IAutoMovieDiagnostic[]) => IAutoMovieFilmTimeline["tracks"]["effects"] = (
  edit: IAutoMovieFilmEdit,
  zones: readonly string[],
  frameRate: IAutoMovieProductionFrameRate,
  totalFrames: number,
  diagnostics: IAutoMovieDiagnostic[],
): IAutoMovieFilmTimeline["tracks"]["effects"] => {
  const output: IAutoMovieFilmTimeline["tracks"]["effects"] = [];
  const ids: Set<string> = new Set<string>();
  let priorStart: number = -1;
  for (const cue of edit.tracks.effects) {
    const startFrame: number | null = productionFilmAssemblyFrameTime(
      cue.start,
      frameRate,
      `${cue.id} effect start`,
      diagnostics,
    );
    const durationFrames: number | null = productionFilmAssemblyFrameTime(
      cue.duration,
      frameRate,
      `${cue.id} effect duration`,
      diagnostics,
    );
    if (startFrame === null || durationFrames === null) continue;
    if (
      cue.id.trim().length === 0 ||
      ids.has(cue.id) ||
      zones.includes(cue.zone) === false ||
      durationFrames === 0 ||
      startFrame + durationFrames > totalFrames ||
      cue.intensity < 0 ||
      cue.intensity > 1 ||
      startFrame < priorStart
    )
      diagnostics.push(
        filmDiagnostic(
          "film-effect-cue-invalid",
          `Effect cue "${cue.id}" must be unique, ordered, in range, reference a registered world zone, and use intensity from 0 through 1.`,
        ),
      );
    ids.add(cue.id);
    priorStart = startFrame;
    output.push({
      id: cue.id,
      recipe: cue.recipe,
      zone: cue.zone,
      startFrame,
      durationFrames,
      intensity: cue.intensity,
    });
  }
  return output;
};
