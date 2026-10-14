import { IAutoMovieDiagnostic, IAutoMovieFilmEdit, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate } from "@automovie/interface";
import { canonicalizeAutoMovieCaptionText, isAutoMovieWebVttIdentifier, parseAutoMovieCaptionLanguage, serializeAutoMovieWebVttSingleLineText } from "@automovie/render";
import { filmDiagnostic } from "./filmDiagnostic";
import { productionFilmAssemblyFrameTime } from "./productionFilmAssemblyFrameTime";

/**
 * Resolve caption start and end boundaries, requiring unique portable WebVTT ids, normalized nonblank text, admitted language tags, optional speakers that remain nonblank after single-line sanitization, and ordered nonoverlapping film ranges. Authored text fields are preserved in the returned track.
 *
 * @evidence contracts/common.md#principled-implementation Exact-grid timing, canonical caption normalization, RFC 5646 language parsing, and WebVTT identifier and speaker rules validate each schema-admitted cue. Positive durations, film bounds, and prior-end ordering define the presentation interval.
 * @evidence contracts/common.md#clear-and-simple-design The cue loop validates the timed caption track and returns its original text, language, and speaker fields; canonical WebVTT byte serialization and readability observation remain downstream responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank or invalid presentation fields append errors rather than receiving generated replacements. Grid failures skip the row, while other invalid rows remain diagnostic intermediates that assembleFilm cannot accept as a draft.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies preserved authored fields, frame units, ordering, portable presentation requirements, and the absence of a readability or fresh visual-observation verdict.
 * @evidence contracts/performance.md#efficient-algorithms The traversal is linear in cues plus all text and language characters scanned by normalization and parsing. Id storage, track rows, and findings grow with cue population without a local quota.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical rate is shared and normalized validation facts are consumed within the cue's checks. No cross-build cache shares text results because authored content, ordering, and film bounds can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned rows and diagnostics, including borrowed string values. Temporary ids and validation text expire after the scan; no font, renderer, file descriptor, or persistent cache is acquired.
 */
export const productionFilmAssemblyNormalizeCaptionCues: (edit: IAutoMovieFilmEdit, frameRate: IAutoMovieProductionFrameRate, totalFrames: number, diagnostics: IAutoMovieDiagnostic[]) => IAutoMovieFilmTimeline["tracks"]["captions"] = (
  edit: IAutoMovieFilmEdit,
  frameRate: IAutoMovieProductionFrameRate,
  totalFrames: number,
  diagnostics: IAutoMovieDiagnostic[],
): IAutoMovieFilmTimeline["tracks"]["captions"] => {
  const output: IAutoMovieFilmTimeline["tracks"]["captions"] = [];
  const ids: Set<string> = new Set<string>();
  let priorEnd: number = 0;
  for (const cue of edit.tracks.captions) {
    const startFrame: number | null = productionFilmAssemblyFrameTime(
      cue.start,
      frameRate,
      `${cue.id} caption start`,
      diagnostics,
    );
    const endFrame: number | null = productionFilmAssemblyFrameTime(
      cue.end,
      frameRate,
      `${cue.id} caption end`,
      diagnostics,
    );
    if (startFrame === null || endFrame === null) continue;
    if (
      cue.id.trim().length === 0 ||
      isAutoMovieWebVttIdentifier(cue.id) === false ||
      ids.has(cue.id) ||
      canonicalizeAutoMovieCaptionText(cue.text).trim().length === 0 ||
      parseAutoMovieCaptionLanguage(cue.language) === null ||
      (cue.speaker !== undefined &&
        serializeAutoMovieWebVttSingleLineText(cue.speaker).trim().length ===
          0) ||
      startFrame < priorEnd ||
      endFrame <= startFrame ||
      endFrame > totalFrames
    )
      diagnostics.push(
        filmDiagnostic(
          "film-caption-cue-invalid",
          `Caption cue "${cue.id}" must be unique, non-overlapping, in range, plain non-blank text, use a well-formed RFC 5646 language tag, and use a non-blank speaker identity.`,
        ),
      );
    ids.add(cue.id);
    priorEnd = endFrame;
    output.push({
      id: cue.id,
      text: cue.text,
      language: cue.language,
      ...(cue.speaker === undefined ? {} : { speaker: cue.speaker }),
      startFrame,
      endFrame,
    });
  }
  return output;
};
