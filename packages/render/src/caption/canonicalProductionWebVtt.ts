import {
  compareCodeUnits,
  productionFrameIntervalToGridTicks,
  resolveProductionFrameRate,
} from "@automovie/engine";
import type { IAutoMovieFilmTimeline } from "@automovie/interface";

import { serializeAutoMovieWebVttCueText } from "./serializeAutoMovieWebVttCueText";
import { serializeAutoMovieWebVttIdentifier } from "./serializeAutoMovieWebVttIdentifier";
import { serializeAutoMovieWebVttSingleLineText } from "./serializeAutoMovieWebVttSingleLineText";
import { webVttCaptionLanguage } from "./webVttCaptionLanguage";
import { webVttTime } from "./webVttTime";

/** Canonical WebVTT derived only from compiled caption placements. */
export const canonicalProductionWebVtt = (
  timeline: IAutoMovieFilmTimeline,
): string => {
  const frameRate = resolveProductionFrameRate(timeline);
  const cues = [...timeline.tracks.captions].sort(
    (left, right) =>
      left.startFrame - right.startFrame ||
      left.endFrame - right.endFrame ||
      compareCodeUnits(left.id, right.id),
  );
  return [
    `WEBVTT ${serializeAutoMovieWebVttIdentifier(timeline.id)}`,
    "",
    ...cues.flatMap((cue) => {
      const interval = productionFrameIntervalToGridTicks({
        startFrame: cue.startFrame,
        endFrame: cue.endFrame,
        frameRate,
        ticksPerSecond: 1_000,
        rounding: "nearest",
      });
      return [
        serializeAutoMovieWebVttIdentifier(cue.id),
        `${webVttTime(interval.start)} --> ${webVttTime(interval.end)}`,
        `<lang ${webVttCaptionLanguage(cue.language)}>${
          cue.speaker === undefined
            ? serializeAutoMovieWebVttCueText(cue.text)
            : `<v ${serializeAutoMovieWebVttSingleLineText(
                cue.speaker,
              )}>${serializeAutoMovieWebVttCueText(cue.text)}</v>`
        }</lang>`,
        "",
      ];
    }),
  ].join("\n");
};
