import {
  IAutoMovieFilmTimeline,
  IAutoMovieFilmTimelineSegment,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieProductionRenderFrame } from "@automovie/engine";
import { IAutoMovieProductionRenderLayer } from "@automovie/engine";
import { sampleProductionRenderFrame } from "@automovie/engine";
import { nclose, throwsError } from "../internal/predicates";
import { sameFilmProductionRenderFrames } from "../internal/sameFilmProductionRenderFrames";
import { sameFilmProductionRenderLayers } from "../internal/sameFilmProductionRenderLayers";

const segment: (
  partial: Partial<IAutoMovieFilmTimelineSegment> &
    Pick<
      IAutoMovieFilmTimelineSegment,
      "shot" | "sourceInFrame" | "sourceOutFrame" | "startFrame" | "endFrame"
    >,
) => IAutoMovieFilmTimelineSegment = (
  partial: Partial<IAutoMovieFilmTimelineSegment> &
    Pick<
      IAutoMovieFilmTimelineSegment,
      "shot" | "sourceInFrame" | "sourceOutFrame" | "startFrame" | "endFrame"
    >,
): IAutoMovieFilmTimelineSegment => ({
  headHandleFrames: 0,
  tailHandleFrames: 0,
  transitionIn: { kind: "cut" },
  transitionOut: { kind: "cut" },
  ...partial,
});

const timeline: (
  segments: IAutoMovieFilmTimelineSegment[],
  totalFrames: number,
  clock?: Pick<IAutoMovieFilmTimeline, "fps" | "frameRate">,
) => IAutoMovieFilmTimeline = (
  segments: IAutoMovieFilmTimelineSegment[],
  totalFrames: number,
  clock: Pick<IAutoMovieFilmTimeline, "fps" | "frameRate"> = { fps: 24 },
): IAutoMovieFilmTimeline => ({
  version: 1,
  builder: "test",
  inputFingerprint: `sha256:${"a".repeat(64)}`,
  sourceDigest: `sha256:${"b".repeat(64)}`,
  id: "film",
  ...clock,
  totalFrames,
  segments,
  omissions: [],
  tracks: { audio: [], captions: [], effects: [] },
});

/**
 * Samples a film timeline and checks fade/dissolve layers, hard-cut source frames, rational-rate timestamp, reverse-order consistency and located schedule failures.
 *
 * Scenarios:
 * 1. Sample fade-in and dissolve start/interior/end layers.
 * 2. Sample fade-out, whose final retained frame has quarter weight, and simultaneous fades.
 * 3. Hand a hard-cut boundary frame to the next segment.
 * 4. Stamp frame three at 30000/1001 fps and preserve reverse-order sampling.
 * 5. Refuse invalid frame indexes, an uncovered frame and an orphan dissolve while admitting its post-window neighbour.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples a film timeline and checks fade/dissolve layers, hard-cut source frames, rational-rate timestamp, reverse-order consistency and located schedule failures.
 * @evidence contracts/testing.md#independent-expectations Integer source-in/out offsets and duration-four linear ramps determine each expected layer; timestamp is binary64 3*1001/30000 rather than exact rational storage. Reverse equality is a relational determinism check and cannot independently expose a shared sampler defect.
 * @evidence contracts/testing.md#distinguishing-cases Retains fade endpoints/interior, dissolve start/interior/end, simultaneous fades, hard cut, rational clock, forward/reverse traversal, invalid clocks, schedule gap and orphan dissolve with its post-window neighbor.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_production_frame_sampling unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_production_frame_sampling(): void {
  const edit: IAutoMovieFilmTimeline = timeline(
    [
      segment({
        shot: "a",
        sourceInFrame: 10,
        sourceOutFrame: 22,
        startFrame: 0,
        endFrame: 12,
        tailHandleFrames: 4,
        transitionIn: { kind: "fade", durationFrames: 4 },
      }),
      segment({
        shot: "b",
        sourceInFrame: 5,
        sourceOutFrame: 17,
        startFrame: 8,
        endFrame: 20,
        headHandleFrames: 4,
        transitionIn: { kind: "dissolve", durationFrames: 4 },
        transitionOut: { kind: "fade", durationFrames: 4 },
      }),
    ],
    20,
  );
  const layers: (frame: number) => IAutoMovieProductionRenderLayer[] = (
    frame: number,
  ): IAutoMovieProductionRenderLayer[] =>
    sampleProductionRenderFrame(edit, frame).layers;

  TestValidator.predicate(
    "a fade-in opens at zero and reaches full weight at its duration",
    [
      [{ shot: "a", sourceFrame: 10, weight: 0 }],
      [{ shot: "a", sourceFrame: 11, weight: 0.25 }],
      [{ shot: "a", sourceFrame: 13, weight: 0.75 }],
      [{ shot: "a", sourceFrame: 14, weight: 1 }],
      [{ shot: "a", sourceFrame: 17, weight: 1 }],
    ].every(
      (expected: IAutoMovieProductionRenderLayer[], index: number): boolean =>
        sameFilmProductionRenderLayers(
          layers([0, 1, 3, 4, 7][index]!),
          expected,
        ),
    ),
  );
  TestValidator.predicate(
    "a dissolve blends the outgoing tail back to front",
    [
      [
        { shot: "a", sourceFrame: 18, weight: 1 },
        { shot: "b", sourceFrame: 5, weight: 0 },
      ],
      [
        { shot: "a", sourceFrame: 20, weight: 0.5 },
        { shot: "b", sourceFrame: 7, weight: 0.5 },
      ],
      [
        { shot: "a", sourceFrame: 21, weight: 0.25 },
        { shot: "b", sourceFrame: 8, weight: 0.75 },
      ],
      [{ shot: "b", sourceFrame: 9, weight: 1 }],
    ].every(
      (expected: IAutoMovieProductionRenderLayer[], index: number): boolean =>
        sameFilmProductionRenderLayers(
          layers([8, 10, 11, 12][index]!),
          expected,
        ),
    ),
  );
  TestValidator.predicate(
    "the fade-out's final retained frame has quarter weight",
    [
      [{ shot: "b", sourceFrame: 12, weight: 1 }],
      [{ shot: "b", sourceFrame: 13, weight: 1 }],
      [{ shot: "b", sourceFrame: 14, weight: 0.75 }],
      [{ shot: "b", sourceFrame: 16, weight: 0.25 }],
    ].every(
      (expected: IAutoMovieProductionRenderLayer[], index: number): boolean =>
        sameFilmProductionRenderLayers(
          layers([15, 16, 17, 19][index]!),
          expected,
        ),
    ),
  );
  const shortFade: IAutoMovieFilmTimeline = timeline(
    [
      segment({
        shot: "e",
        sourceInFrame: 0,
        sourceOutFrame: 4,
        startFrame: 0,
        endFrame: 4,
        transitionIn: { kind: "fade", durationFrames: 4 },
        transitionOut: { kind: "fade", durationFrames: 4 },
      }),
    ],
    4,
  );
  TestValidator.predicate(
    "a segment fading in and out takes the smaller weight",
    [0, 1, 2, 3]
      .map(
        (frame: number): number =>
          sampleProductionRenderFrame(shortFade, frame).layers[0]!.weight,
      )
      .every((weight: number, index: number): boolean =>
        nclose(weight, [0, 0.25, 0.5, 0.25][index]!),
      ),
  );

  const cut: IAutoMovieFilmTimeline = timeline(
    [
      segment({
        shot: "c",
        sourceInFrame: 3,
        sourceOutFrame: 9,
        startFrame: 0,
        endFrame: 6,
      }),
      segment({
        shot: "d",
        sourceInFrame: 0,
        sourceOutFrame: 4,
        startFrame: 6,
        endFrame: 10,
      }),
    ],
    10,
  );
  TestValidator.predicate(
    "a hard cut hands the start frame to the next segment",
    [
      [{ shot: "c", sourceFrame: 8, weight: 1 }],
      [{ shot: "d", sourceFrame: 0, weight: 1 }],
    ].every(
      (expected: IAutoMovieProductionRenderLayer[], index: number): boolean =>
        sameFilmProductionRenderLayers(
          sampleProductionRenderFrame(cut, [5, 6][index]!).layers,
          expected,
        ),
    ),
  );

  const rational: IAutoMovieFilmTimeline = timeline(
    [
      segment({
        shot: "r",
        sourceInFrame: 0,
        sourceOutFrame: 10,
        startFrame: 0,
        endFrame: 10,
      }),
    ],
    10,
    { fps: 30000 / 1001, frameRate: { numerator: 30000, denominator: 1001 } },
  );
  TestValidator.predicate(
    "a rational clock stamps the independently calculated frame time within 1e-6",
    sameFilmProductionRenderFrames(
      [sampleProductionRenderFrame(rational, 3)],
      [
        {
          globalFrame: 3,
          timelineFrame: 3,
          timeSeconds: 3003 / 30000,
          layers: [{ shot: "r", sourceFrame: 3, weight: 1 }],
        },
      ],
    ),
  );
  const forward: IAutoMovieProductionRenderFrame[] = Array.from(
    { length: 20 },
    (_: unknown, frame: number): IAutoMovieProductionRenderFrame =>
      sampleProductionRenderFrame(edit, frame),
  );
  const reverse: IAutoMovieProductionRenderFrame[] = Array.from(
    { length: 20 },
    (_: unknown, index: number): IAutoMovieProductionRenderFrame =>
      sampleProductionRenderFrame(edit, 19 - index),
  ).reverse();
  TestValidator.predicate(
    "reverse sampling equals the forward schedule",
    sameFilmProductionRenderFrames(reverse, forward),
  );

  const firstDissolve: IAutoMovieFilmTimeline = timeline(
    [
      segment({
        shot: "x",
        sourceInFrame: 0,
        sourceOutFrame: 4,
        startFrame: 0,
        endFrame: 4,
        transitionIn: { kind: "dissolve", durationFrames: 2 },
      }),
    ],
    4,
  );
  const gap: IAutoMovieFilmTimeline = timeline(
    [
      segment({
        shot: "g",
        sourceInFrame: 0,
        sourceOutFrame: 4,
        startFrame: 0,
        endFrame: 4,
      }),
    ],
    8,
  );
  TestValidator.equals(
    "frames outside the schedule or its sources are refused by name",
    {
      negative: throwsError(
        (): IAutoMovieProductionRenderFrame =>
          sampleProductionRenderFrame(edit, -1),
        "Film-global frame -1 is outside 0..19.",
      ),
      fractional: throwsError(
        (): IAutoMovieProductionRenderFrame =>
          sampleProductionRenderFrame(edit, 1.5),
        "outside 0..19",
      ),
      end: throwsError(
        (): IAutoMovieProductionRenderFrame =>
          sampleProductionRenderFrame(edit, 20),
        "outside 0..19",
      ),
      uncovered: throwsError(
        (): IAutoMovieProductionRenderFrame =>
          sampleProductionRenderFrame(gap, 5),
        "Film-global frame 5 has no builder-owned video segment.",
      ),
      orphanDissolve: throwsError(
        (): IAutoMovieProductionRenderFrame =>
          sampleProductionRenderFrame(firstDissolve, 0),
        'Segment "x" dissolves without an outgoing segment.',
      ),
    },
    {
      negative: true,
      fractional: true,
      end: true,
      uncovered: true,
      orphanDissolve: true,
    },
  );
  TestValidator.predicate(
    "the orphan segment samples normally after its dissolve window",
    sameFilmProductionRenderLayers(
      sampleProductionRenderFrame(firstDissolve, 2).layers,
      [{ shot: "x", sourceFrame: 2, weight: 1 }],
    ),
  );
}
