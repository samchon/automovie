import {
  materializeCompiledEffects,
  productionFilmFrameForShotTime,
  projectProductionShotEffectFilmIntervals,
  sampleCompiledEffect,
} from "@automovie/engine";
import {
  type IAutoMovieCompiledEffect,
  type IAutoMovieEffectSample,
  type IAutoMovieFilmEffectClock,
  IAutoMovieFilmTimelineSegment,
  type IAutoMovieShotContract,
  type IAutoMovieShotEffectFilmInterval,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import {
  filmEffectRefusal,
  filmEffectWorld,
} from "./filmEffectRuntimeFixtures";

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
 * 4. Compare ownership and runtime samples when cue bounds fall between simulation steps.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs interval projection and shot-time mapping and asserts exact integer frame records, refusal classes and null ambiguity, catching a rounded seconds-times-rate estimate that assigns an adjacent frame.
 * @evidence contracts/development/testing.md#independent-expectations The half-open source interval and exact boundary-second comparison determine expected integer frames by hand; selected adjacent doubles around 32/24 and 34/24 distinguish the rounded product estimate. Frame outputs are discrete indexes, not floating coordinate comparisons.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers repeated/absent shots, segment trimming, zero, four one-ulp witnesses, invalid/unrepresentable seconds/intervals and inconsistent clocks. A cue from 0.04 to 0.12 seconds on a 0.1-second step exposes lost opening bursts and effects lingering into an unowned frame.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous discoverable unit owns portable timeline queries without a review-page/browser host; productionFilmFrameForShotTime currently has test-only reach, so this verifies its semantics rather than a live installed consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists four projection cases, including how an off-grid cue is sampled across its first and last owned frames.
 */
export function test_unit_engine_film_effect_shot_frame_projection(): void {
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

  const flash: IAutoMovieCompiledEffect = materializeCompiledEffects({
    world: filmEffectWorld(),
    contract: { id: "w" } as IAutoMovieShotContract,
    fixedStepSeconds: 0.1,
    cues: [
      {
        id: "flash",
        zone: "yard",
        start: 0.04,
        end: 0.12,
        intensity: { from: 1, to: 1 },
      },
    ],
  })[0]!;
  TestValidator.equals(
    "a source trim places the two owned off-grid frames at the edit start",
    projectProductionShotEffectFilmIntervals({
      timeline: { fps: 24, segments: [segment("w", 1, 4, 0)] },
      shots: new Map([["w", { effects: [flash] }]]),
    }),
    [{ cue: "flash", shot: "w", zone: "yard", startFrame: 0, endFrame: 2 }],
  );
  const samples: IAutoMovieEffectSample[] = [0, 1, 2, 3].map(
    (source: number): IAutoMovieEffectSample =>
      sampleCompiledEffect(flash, source / 24),
  );
  TestValidator.equals(
    "simulation rounding neither drops the first owned frame nor extends the cue",
    samples.map((sample: IAutoMovieEffectSample): boolean => sample.active),
    [false, true, true, false],
  );
  TestValidator.predicate(
    "the first owned frame samples the opening burst at the authored start",
    nclose(samples[1]!.time, 0.04) && samples[1]!.particles.length === 2,
  );
}
