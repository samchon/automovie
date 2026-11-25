import {
  compareCodeUnits,
  productionFrameIntervalToGridTicks,
  resolveProductionFrameRate,
} from "@automovie/engine";
import type {
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { serializeAutoMovieWebVttCueText } from "./serializeAutoMovieWebVttCueText.js";
import { serializeAutoMovieWebVttIdentifier } from "./serializeAutoMovieWebVttIdentifier.js";
import { serializeAutoMovieWebVttSingleLineText } from "./serializeAutoMovieWebVttSingleLineText.js";
import { webVttCaptionLanguage } from "./webVttCaptionLanguage.js";
import { webVttTime } from "./webVttTime.js";

type ICaptionCue = IAutoMovieFilmTimeline["tracks"]["captions"][number];

/**
 * Serialize a compiled timeline's caption track as the one canonical WebVTT
 * file its caption deliverable must equal byte for byte.
 *
 * The header carries the timeline id. Cues are ordered by start frame, then end
 * frame, then id in code-unit order, and each cue's frame interval maps to
 * whole milliseconds with nearest rounding on the exact production frame rate.
 * An authored top or bottom placement selects the first or last snapped line of
 * a horizontal cue. Omitted placement uses WebVTT automatic line placement. The
 * payload sits in a `<lang>` span, inside a `<v>` voice span when the cue names
 * a speaker, and every block ends with a blank line. Throws when an id is not a
 * WebVTT identifier, a language is not a well-formed RFC 5646 tag, the
 * timeline's `fps` disagrees with its exact frame rate, or a cue interval is
 * empty or collapses on the millisecond clock, or a placement is unsupported.
 */
export const canonicalProductionWebVtt: (
  timeline: IAutoMovieFilmTimeline,
) => string = (timeline: IAutoMovieFilmTimeline): string => {
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
        `${webVttTime(interval.start)} --> ${webVttTime(interval.end)}${lineSetting(cue)}`,
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

/**
 * Map the authored edge to a snapped line, with automatic placement for legacy
 * cues.
 */
const lineSetting = (cue: ICaptionCue): string => {
  switch (cue.placement) {
    case undefined:
      return "";
    case "top":
      return " line:0";
    case "bottom":
      return " line:-1";
    default:
      throw new Error(`Caption cue "${cue.id}" has an unsupported placement.`);
  }
};
