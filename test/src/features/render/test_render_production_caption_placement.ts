import type { IAutoMovieFilmTimeline } from "@automovie/interface";
import { canonicalProductionWebVtt } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Authored caption placement travels with each cue through WebVTT export.
 *
 * Scenarios:
 *
 * 1. Two authored edges and one omitted edge serialize in frame order with
 *    distinct snapped-line settings and an unchanged automatic cue.
 * 2. An unsupported placement value from untyped input is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public WebVTT exporter with unsorted cues and compares the complete file so it catches swapped edges, lost automatic placement and changed text or timing. A separate call refuses invalid placement.
 * @evidence contracts/development/testing.md#independent-expectations WebVTT horizontal snapped lines count nonnegative values from the top and negative values from the bottom. The literal expected times come from 24 frames per second. The oracle checks file syntax and leaves player layout to WebVTT clients.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers top, bottom, undefined legacy placement and malformed untyped placement. The language-tag grammar test owns language admission boundaries.
 * @evidence contracts/development/testing.md#execution-ownership This discovered synchronous Render test owns both in-memory scenarios without file access or a media player.
 * @evidence contracts/development/common.md#meaningful-documentation Lists both scenarios, identifies the exporter seam and explains the source and limits of the expected values.
 */
export function test_render_production_caption_placement(): void {
  type ICaption = IAutoMovieFilmTimeline["tracks"]["captions"][number];
  const top: ICaption = {
    id: "top",
    text: "A door slams.",
    language: "en",
    startFrame: 0,
    endFrame: 24,
    placement: "top",
  };
  const bottom: ICaption = {
    id: "bottom",
    text: "Wait!",
    language: "en",
    speaker: "Jo",
    startFrame: 24,
    endFrame: 48,
    placement: "bottom",
  };
  const automatic: ICaption = {
    id: "automatic",
    text: "Footsteps fade.",
    language: "en",
    startFrame: 48,
    endFrame: 72,
  };
  const timeline: IAutoMovieFilmTimeline = {
    version: 1,
    builder: "fixture",
    inputFingerprint: "fixture",
    sourceDigest: "fixture",
    id: "placement-example",
    fps: 24,
    totalFrames: 72,
    segments: [],
    omissions: [],
    tracks: { audio: [], captions: [bottom, automatic, top], effects: [] },
  };

  TestValidator.equals(
    "serialize each authored cue edge",
    canonicalProductionWebVtt(timeline),
    [
      "WEBVTT placement-example",
      "",
      "top",
      "00:00:00.000 --> 00:00:01.000 line:0",
      "<lang en>A door slams.</lang>",
      "",
      "bottom",
      "00:00:01.000 --> 00:00:02.000 line:-1",
      "<lang en><v Jo>Wait!</v></lang>",
      "",
      "automatic",
      "00:00:02.000 --> 00:00:03.000",
      "<lang en>Footsteps fade.</lang>",
      "",
    ].join("\n"),
  );

  const malformed: ICaption = {
    ...top,
    placement: "center" as ICaption["placement"],
  };
  const invalid: IAutoMovieFilmTimeline = {
    ...timeline,
    tracks: { ...timeline.tracks, captions: [malformed] },
  };
  TestValidator.predicate(
    "refuse the malformed edge on the authored cue",
    throwsError(
      (): string => canonicalProductionWebVtt(invalid),
      ['"top"', "unsupported placement"],
    ),
  );
}
