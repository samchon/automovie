import {
  compareCodeUnits,
  productionFrameIntervalToGridTicks,
  resolveProductionFrameRate,
} from "@automovie/engine";
import type {
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { serializeAutoMovieWebVttCueText } from "./serializeAutoMovieWebVttCueText";
import { serializeAutoMovieWebVttIdentifier } from "./serializeAutoMovieWebVttIdentifier";
import { serializeAutoMovieWebVttSingleLineText } from "./serializeAutoMovieWebVttSingleLineText";
import { webVttCaptionLanguage } from "./webVttCaptionLanguage";
import { webVttTime } from "./webVttTime";

type ICaptionCue = IAutoMovieFilmTimeline["tracks"]["captions"][number];

/**
 * Serialize a compiled timeline's caption track as the one canonical WebVTT
 * file its caption deliverable must equal byte for byte.
 *
 * The header carries the timeline id. Cues are ordered by start frame, then end
 * frame, then id in code-unit order, and each cue's frame interval maps to
 * whole milliseconds with nearest rounding on the exact production frame rate.
 * The payload sits in a `<lang>` span, inside a `<v>` voice span when the cue
 * names a speaker, and every block ends with a blank line. Throws when an id is
 * not a WebVTT identifier, a language is not a well-formed RFC 5646 tag, the
 * timeline's `fps` disagrees with its exact frame rate, or a cue interval is
 * empty or collapses on the millisecond clock.
 *
 * @evidence contracts/common.md#principled-implementation The cue syntax follows the W3C WebVTT file grammar: identifiers are preserved verbatim, cue text and annotations are escaped by the shared serializers, and times come from `productionFrameIntervalToGridTicks`, whose BigInt arithmetic maps each rational frame boundary to an exact integer millisecond before formatting.
 * @evidence contracts/common.md#clear-and-simple-design The function only orders cues and assembles lines; identifier refusal, text escaping, language validation, frame-to-tick mapping and timestamp spelling each live in the helper that owns them, so the delivery validator compares against the same bytes the writer emits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only fixed values are WebVTT syntax and the 1000-tick millisecond clock WebVTT timestamps require; nothing is special-cased per cue, and a malformed cue throws instead of being skipped.
 * @evidence contracts/common.md#meaningful-documentation The doc states the byte-equality role, the header source, the cue order, the millisecond rounding, the span nesting, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For C cues of text length L the cost is an O(C log C) sort of a copied array plus O(L) escaping per cue; the copy keeps the caller's timeline unmodified, and the sort is needed because the order is part of the canonical bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call serializes one timeline into a fresh string and coordinates no phases or consumers whose work it could share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the sorted copy and the line array are held, both released on return; the output string, owned by the caller, grows linearly with cue count and text length.
 */
export const canonicalProductionWebVtt: (timeline: IAutoMovieFilmTimeline) => string = (
  timeline: IAutoMovieFilmTimeline,
): string => {
  const frameRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(timeline);
  const cues: ICaptionCue[] = [...timeline.tracks.captions].sort(
    (left: ICaptionCue, right: ICaptionCue): number =>
      left.startFrame - right.startFrame ||
      left.endFrame - right.endFrame ||
      compareCodeUnits(left.id, right.id),
  );
  return [
    `WEBVTT ${serializeAutoMovieWebVttIdentifier(timeline.id)}`,
    "",
    ...cues.flatMap((cue: ICaptionCue): string[] => {
      const interval: { start: number; end: number } =
        productionFrameIntervalToGridTicks({
          startFrame: cue.startFrame,
          endFrame: cue.endFrame,
          frameRate,
          ticksPerSecond: 1_000,
          rounding: "nearest",
        });
      const payload: string = serializeAutoMovieWebVttCueText(cue.text);
      return [
        serializeAutoMovieWebVttIdentifier(cue.id),
        `${webVttTime(interval.start)} --> ${webVttTime(interval.end)}`,
        `<lang ${webVttCaptionLanguage(cue.language)}>${
          cue.speaker === undefined
            ? payload
            : `<v ${serializeAutoMovieWebVttSingleLineText(cue.speaker)}>${payload}</v>`
        }</lang>`,
        "",
      ];
    }),
  ].join("\n");
};
