import { IAutoMovieFilmTimelineSegment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieFilmEffectClock } from "@automovie/engine";
import { IAutoMovieShotEffectFilmInterval } from "@automovie/engine";
import { productionFilmFrameForShotTime } from "@automovie/engine";
import { projectProductionShotEffectFilmIntervals } from "@automovie/engine";
import { filmEffectRefusal } from "./filmEffectRuntimeFixtures";

const segment: (
  shot: string,
  sourceInFrame: number,
  sourceOutFrame: number,
  startFrame: number,
) => IAutoMovieFilmTimelineSegment = (
  shot: string,
  sourceInFrame: number,
  sourceOutFrame: number,
  startFrame: number,
): IAutoMovieFilmTimelineSegment => ({
  shot,
  sourceInFrame,
  sourceOutFrame,
  startFrame,
  endFrame: startFrame + sourceOutFrame - sourceInFrame,
  headHandleFrames: 0,
  tailHandleFrames: 0,
  transitionIn: { kind: "cut" },
  transitionOut: { kind: "cut" },
});

/**
 * Shot intervals and review seconds map through rational film frame boundaries.
 *
 * Scenarios:
 * 1. Trim repeated shot occurrences and drop absent/empty intersections.
 * 2. Resolve four floating boundary witnesses and frame zero.
 * 3. Refuse malformed intervals/clocks and return null for invalid, absent or multiply realized seconds.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs interval projection and shot-time mapping and asserts exact integer frame records, refusal classes and null ambiguity, catching a rounded seconds-times-rate estimate that assigns an adjacent frame.
 * @evidence contracts/testing.md#independent-expectations The half-open source interval and exact boundary-second comparison determine expected integer frames by hand; selected adjacent doubles around 32/24 and 34/24 distinguish the rounded product estimate. Frame outputs are discrete indexes, not floating coordinate comparisons.
 * @evidence contracts/testing.md#distinguishing-cases Covers repeated/absent shots, segment trimming, zero, four one-ulp witnesses, invalid/unrepresentable seconds/intervals and inconsistent clocks. Sampling particle state belongs to runtime_sampling.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable unit owns portable timeline queries without a review-page/browser host; productionFilmFrameForShotTime currently has test-only reach, so this verifies its semantics rather than a live installed consumer.
 */
export function test_film_effect_shot_frame_projection(): void {
  const clock: IAutoMovieFilmEffectClock = {
    fps: 24,
    segments: [
      segment("s1", 0, 48, 0),
      segment("s2", 10, 30, 48),
      segment("s1", 24, 48, 68),
      segment("ghost", 0, 10, 92),
    ],
  };
  const effect: (
    id: string,
    start: number,
    end: number,
    zone?: string,
  ) => { id: string; zone: string; start: number; end: number } = (
    id: string,
    start: number,
    end: number,
    zone: string = "yard",
  ): { id: string; zone: string; start: number; end: number } => ({
    id,
    zone,
    start,
    end,
  });
  TestValidator.equals(
    "every occurrence is trimmed to its segment",
    projectProductionShotEffectFilmIntervals({
      timeline: clock,
      shots: new Map([
        ["s1", { effects: [effect("c1", 0.5, 1.25)] }],
        [
          "s2",
          { effects: [effect("c2", 0, 0.25, "gate"), effect("c3", 1, 2)] },
        ],
      ]),
    }),
    [
      { cue: "c1", shot: "s1", zone: "yard", startFrame: 12, endFrame: 30 },
      { cue: "c3", shot: "s2", zone: "yard", startFrame: 62, endFrame: 68 },
      { cue: "c1", shot: "s1", zone: "yard", startFrame: 68, endFrame: 74 },
    ],
  );

  const at25: IAutoMovieFilmEffectClock = {
    fps: 25,
    segments: [segment("w", 0, 100, 0)],
  };
  TestValidator.equals(
    "float estimates are corrected onto the exact boundary",
    [
      projectProductionShotEffectFilmIntervals({
        timeline: at25,
        shots: new Map([["w", { effects: [effect("witness", 0.28, 1.16)] }]]),
      }),
      projectProductionShotEffectFilmIntervals({
        timeline: { fps: 24, segments: [segment("w", 0, 100, 0)] },
        shots: new Map([
          [
            "w",
            {
              effects: [
                effect("above", 1.3333333333333335, 1.5),
                effect("zero", 0, 0.125),
              ],
            },
          ],
        ]),
      }),
    ],
    [
      [
        {
          cue: "witness",
          shot: "w",
          zone: "yard",
          startFrame: 7,
          endFrame: 29,
        },
      ],
      [
        { cue: "above", shot: "w", zone: "yard", startFrame: 33, endFrame: 36 },
        { cue: "zero", shot: "w", zone: "yard", startFrame: 0, endFrame: 3 },
      ],
    ],
  );
  TestValidator.equals(
    "an invalid or unrepresentable interval and a contradictory clock are refused",
    [
      effect("nan", Number.NaN, 1),
      effect("negative", -0.5, 1),
      effect("empty", 0.5, 0.5),
      effect("infinite", 0, Number.POSITIVE_INFINITY),
      effect("huge", 1e300, 2e300),
    ]
      .map(
        (item: {
          id: string;
          zone: string;
          start: number;
          end: number;
        }): string =>
          filmEffectRefusal((): IAutoMovieShotEffectFilmInterval[] =>
            projectProductionShotEffectFilmIntervals({
              timeline: clock,
              shots: new Map([["s1", { effects: [item] }]]),
            }),
          ),
      )
      .concat(
        filmEffectRefusal((): IAutoMovieShotEffectFilmInterval[] =>
          projectProductionShotEffectFilmIntervals({
            timeline: {
              ...clock,
              frameRate: { numerator: 25, denominator: 1 },
            },
            shots: new Map(),
          }),
        ),
      ),
    Array.from({ length: 6 }, (): string => "film-effect-input-invalid"),
  );

  const frame: (
    shot: string,
    time: number,
    timeline?: IAutoMovieFilmEffectClock,
  ) => number | null = (
    shot: string,
    time: number,
    timeline: IAutoMovieFilmEffectClock = clock,
  ): number | null => productionFilmFrameForShotTime({ timeline, shot, time });
  TestValidator.equals(
    "a second realized exactly once maps to its film frame",
    [
      frame("s1", 0.5),
      frame("s1", 0),
      frame("s2", 1),
      frame("w", 1.4166666666666665, {
        fps: 24,
        segments: [segment("w", 0, 100, 0)],
      }),
      frame("w", 1.16, at25),
    ],
    [12, 0, 62, 33, 29],
  );
  TestValidator.equals(
    "a repeated, absent, unknown, or invalid second maps to null",
    [
      frame("s1", 1.5),
      frame("s2", 0.1),
      frame("unknown", 0.5),
      frame("s1", Number.NaN),
      frame("s1", -1),
      frame("s1", Number.POSITIVE_INFINITY),
      frame("s1", 1e300),
    ],
    [null, null, null, null, null, null, null],
  );
  TestValidator.equals(
    "a contradictory clock is refused before any second is mapped",
    filmEffectRefusal((): number | null =>
      frame("s1", 0.5, {
        ...clock,
        frameRate: { numerator: 25, denominator: 1 },
      }),
    ),
    "film-effect-input-invalid",
  );
}
