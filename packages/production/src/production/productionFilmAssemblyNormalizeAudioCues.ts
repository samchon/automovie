import { IAutoMovieDiagnostic, IAutoMovieFilmEdit, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate } from "@automovie/interface";
import { filmDiagnostic } from "./filmDiagnostic";
import { productionFilmAssemblyFrameTime } from "./productionFilmAssemblyFrameTime";

/**
 * Resolve audio cue source ranges, placement, fades, gain, and asset identities into timeline frames while appending errors. Invalid-grid cues are skipped; other invalid normalized rows remain only for further diagnostics until assembleFilm refuses the draft.
 *
 * @evidence contracts/common.md#principled-implementation The shared exact-grid converter resolves six time fields, followed by unique ids, declared assets, positive ranges, film bounds, fade limits, finite gain in zero through four, and nondecreasing starts. Cue structure is already schema-admitted.
 * @evidence contracts/common.md#clear-and-simple-design One ordered cue loop keeps normalization and its range checks together, returning timeline records without opening audio assets or performing mixing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Asset membership is literal current-context membership, not a fixture whitelist. No invalid range, gain, or missing asset is repaired; emitted rows with errors cannot become an accepted film draft.
 * @evidence contracts/common.md#meaningful-documentation The comment describes frame units, skipped grid failures, collected invalid rows, diagnostic ownership, and the boundary between structural scheduling and actual decoding or mixing.
 * @evidence contracts/performance.md#efficient-algorithms Cue timing and id checks are linear in cues, with the existing includes lookup adding cue-count times asset-count work. Output and diagnostic storage grow with cue population, with no local count bound.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's canonical rate and asset list are reused; normalized rows are passed to the draft. No prior cue result is cached because current assets, film bounds, and authored timings determine validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned track and appended findings transfer to the caller. The local id set expires after the scan, and no audio bytes, synthesis tasks, or native handles are acquired.
 */
export const productionFilmAssemblyNormalizeAudioCues: (edit: IAutoMovieFilmEdit, assets: readonly string[], frameRate: IAutoMovieProductionFrameRate, totalFrames: number, diagnostics: IAutoMovieDiagnostic[]) => IAutoMovieFilmTimeline["tracks"]["audio"] = (
  edit: IAutoMovieFilmEdit,
  assets: readonly string[],
  frameRate: IAutoMovieProductionFrameRate,
  totalFrames: number,
  diagnostics: IAutoMovieDiagnostic[],
): IAutoMovieFilmTimeline["tracks"]["audio"] => {
  const output: IAutoMovieFilmTimeline["tracks"]["audio"] = [];
  const ids: Set<string> = new Set<string>();
  let priorStart: number = -1;
  for (const cue of edit.tracks.audio) {
    const sourceDurationFrames: number | null = productionFilmAssemblyFrameTime(
      cue.sourceDuration,
      frameRate,
      `${cue.id} audio source duration`,
      diagnostics,
    );
    const sourceOffsetFrame: number | null = productionFilmAssemblyFrameTime(
      cue.sourceOffset,
      frameRate,
      `${cue.id} audio source offset`,
      diagnostics,
    );
    const startFrame: number | null = productionFilmAssemblyFrameTime(
      cue.start,
      frameRate,
      `${cue.id} audio start`,
      diagnostics,
    );
    const durationFrames: number | null = productionFilmAssemblyFrameTime(
      cue.duration,
      frameRate,
      `${cue.id} audio duration`,
      diagnostics,
    );
    const fadeInFrames: number | null = productionFilmAssemblyFrameTime(
      cue.fadeIn,
      frameRate,
      `${cue.id} audio fadeIn`,
      diagnostics,
    );
    const fadeOutFrames: number | null = productionFilmAssemblyFrameTime(
      cue.fadeOut,
      frameRate,
      `${cue.id} audio fadeOut`,
      diagnostics,
    );
    if (
      sourceDurationFrames === null ||
      sourceOffsetFrame === null ||
      startFrame === null ||
      durationFrames === null ||
      fadeInFrames === null ||
      fadeOutFrames === null
    )
      continue;
    if (
      cue.id.trim().length === 0 ||
      ids.has(cue.id) ||
      assets.includes(cue.asset) === false ||
      sourceDurationFrames === 0 ||
      durationFrames === 0 ||
      sourceOffsetFrame + durationFrames > sourceDurationFrames ||
      startFrame + durationFrames > totalFrames ||
      fadeInFrames + fadeOutFrames > durationFrames ||
      Number.isFinite(cue.gain) === false ||
      cue.gain < 0 ||
      cue.gain > 4 ||
      startFrame < priorStart
    )
      diagnostics.push(
        filmDiagnostic(
          "film-audio-cue-invalid",
          `Audio cue "${cue.id}" must be unique, ordered, in film/source range, reference a present declared asset, use fades within duration, and set gain from 0 through 4.`,
        ),
      );
    ids.add(cue.id);
    priorStart = startFrame;
    output.push({
      id: cue.id,
      asset: cue.asset,
      sourceDurationFrames,
      sourceOffsetFrame,
      startFrame,
      durationFrames,
      gain: cue.gain,
      fadeInFrames,
      fadeOutFrames,
      bus: cue.bus,
    });
  }
  return output;
};
