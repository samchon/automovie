import { AutoMovieEngineEffect } from "@automovie/engine";
import {
  IAutoMovieCompiledFilmEffect,
  type IAutoMovieFilmEffectCurrentIdentity,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
  type IAutoMovieShotEffectFilmInterval,
  IAutoMovieWorldDesign,
  IAutoMovieWorldEffectZone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectCue } from "../../internal/filmEffectCue";
import { filmEffectIdentity } from "../../internal/filmEffectIdentity";
import { filmEffectRecipe } from "../../internal/filmEffectRecipe";
import { filmEffectRefusal } from "../../internal/filmEffectRefusal";
import { filmEffectTimeline } from "../../internal/filmEffectTimeline";
import { filmEffectWorld } from "../../internal/filmEffectWorld";
import { filmEffectZone } from "../../internal/filmEffectZone";
import { nclose } from "../../internal/nclose";
import { nodeCanonicalDigest } from "../../internal/nodeCanonicalDigest";
import { throwsError } from "../../internal/predicates";

/** Each film cue's id, zone, start and end frame and constant intensity. */
const EXPECTED_CUES: ReadonlyArray<[string, string, number, number, number]> = [
  ["haze", "gate", 0, 6, 1],
  ["mist", "yard", 12, 24, 0.5],
  ["dew", "yard", 24, 30, 0.5],
];

/** Exact in binary64: integer frame products fit and both sides round the same quotient once. */
const FRAME_SECONDS_TOLERANCE: number = 0;

/**
 * Film cue materialization enforces current identity, rational clock and
 * exclusive zone ownership.
 *
 * Scenarios:
 *
 * 1. Check canonical ordering, identity, frames, rational seconds, protocol
 *    seeds/digests and reader acceptance.
 * 2. Refuse an invalid fingerprint/rate, duplicate world ids, malformed
 *    intervals/cues and missing zone/recipe.
 * 3. Distinguish same-zone overlap from touching intervals or different zones, and
 *    preserve only declared runtime fields.
 */
export function test_engine_film_effect_materialization(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline([
    filmEffectCue(),
    filmEffectCue({
      id: "haze",
      zone: "gate",
      startFrame: 0,
      durationFrames: 6,
      intensity: 1,
    }),
    filmEffectCue({ id: "dew", startFrame: 24, durationFrames: 6 }),
  ]);
  const identity: IAutoMovieFilmEffectCurrentIdentity =
    filmEffectIdentity(timeline);
  const materialize: (
    overrides: Partial<Parameters<typeof AutoMovieEngineEffect.materializeProductionFilmEffects>[0]>,
  ) => IAutoMovieCompiledFilmEffect[] = (
    overrides: Partial<Parameters<typeof AutoMovieEngineEffect.materializeProductionFilmEffects>[0]>,
  ): IAutoMovieCompiledFilmEffect[] =>
    AutoMovieEngineEffect.materializeProductionFilmEffects({
      identity,
      frameRate: 24,
      world: filmEffectWorld(),
      effects: timeline.tracks.effects,
      ...overrides,
    });
  const output: IAutoMovieCompiledFilmEffect[] = materialize({});
  const zoneOf: (id: string) => IAutoMovieWorldEffectZone = (
    id: string,
  ): IAutoMovieWorldEffectZone =>
    filmEffectWorld().effectZones.find(
      (zone: IAutoMovieWorldEffectZone): boolean => zone.id === id,
    )!;

  TestValidator.equals(
    "cues become ordered runtimes on their integer frame clock",
    output.map(
        (
          runtime: IAutoMovieCompiledFilmEffect,
        ): {
          id: string;
          zone: string;
          owner: (string | number)[];
          identity: string[];
          rate: IAutoMovieProductionFrameRate;
          frames: number[];
          intensity: { from: number; to: number };
        } => ({
          id: runtime.effect.id,
          zone: runtime.effect.zone,
          owner: [runtime.version, runtime.owner, runtime.clock],
          identity: [
            runtime.production,
            runtime.film,
            runtime.compileFingerprint,
            runtime.editFingerprint,
          ],
          rate: runtime.frameRate,
          frames: [runtime.startFrame, runtime.endFrame],
          intensity: runtime.effect.intensity,
        }),
      ),
      EXPECTED_CUES.map(
        ([id, zone, start, end, intensity]: [
          string,
          string,
          number,
          number,
          number,
        ]): {
          id: string;
          zone: string;
          owner: (string | number)[];
          identity: string[];
          rate: { numerator: number; denominator: number };
          frames: number[];
          intensity: { from: number; to: number };
        } => ({
          id,
          zone,
          owner: [1, "film", "timeline-frame"],
          identity: [
            "production",
            "film",
            timeline.inputFingerprint,
            identity.editFingerprint,
          ],
          rate: { numerator: 24, denominator: 1 },
          frames: [start, end],
          intensity: { from: intensity, to: intensity },
        }),
      ),
  );
  TestValidator.predicate(
    "every projected second is on the same frame clock",
    output.every((runtime: IAutoMovieCompiledFilmEffect, index: number): boolean => {
      const [, , start, end]: (typeof EXPECTED_CUES)[number] = EXPECTED_CUES[index]!;
      return nclose(runtime.effect.start, start / 24, FRAME_SECONDS_TOLERANCE) &&
        nclose(runtime.effect.end, end / 24, FRAME_SECONDS_TOLERANCE) &&
        nclose(runtime.effect.fixedStepSeconds, 1 / 24, FRAME_SECONDS_TOLERANCE);
    }),
  );
  TestValidator.equals(
    "seeds and digests are the documented protocol through node:crypto",
    output.map((runtime: IAutoMovieCompiledFilmEffect): (string | number)[] => [
      runtime.effect.seed,
      runtime.effect.digest,
      runtime.digest,
    ]),
    output.map((runtime: IAutoMovieCompiledFilmEffect): (string | number)[] => [
      Number.parseInt(
        nodeCanonicalDigest({
          protocol: "automovie.film-effect-seed.v1",
          owner: { production: "production", film: "film" },
          cue: runtime.effect.id,
          recipe: filmEffectRecipe(),
          zone: zoneOf(runtime.effect.zone),
        }).slice(7, 20),
        16,
      ),
      nodeCanonicalDigest({ ...runtime.effect, digest: undefined }),
      nodeCanonicalDigest({ ...runtime, digest: undefined }),
    ]),
  );
  TestValidator.equals(
    "the written population verifies against its timeline",
    filmEffectRefusal((): void =>
      AutoMovieEngineEffect.verifyProductionFilmEffectPopulation({ timeline, effects: output }),
    ),
    "accepted",
  );

  TestValidator.equals(
    "cues starting on one frame are ordered by code-unit id, not collation",
    materialize({
      effects: [
        filmEffectCue({
          id: "a",
          zone: "gate",
          startFrame: 0,
          durationFrames: 6,
        }),
        filmEffectCue({ id: "B", startFrame: 0, durationFrames: 6 }),
      ],
    }).map(
      (runtime: IAutoMovieCompiledFilmEffect): string => runtime.effect.id,
    ),
    ["B", "a"],
  );

  const rational: IAutoMovieProductionFrameRate = {
    numerator: 30000,
    denominator: 1001,
  };
  const rationalRuntime: IAutoMovieCompiledFilmEffect = materialize({
    frameRate: rational,
    effects: [filmEffectCue({ startFrame: 3, durationFrames: 2 })],
  })[0]!;
  TestValidator.equals("the reduced rational frame rate", rationalRuntime.frameRate, rational);
  TestValidator.predicate(
    "a rational clock yields the authored rational bounds",
    nclose(rationalRuntime.effect.start, 3003 / 30000, FRAME_SECONDS_TOLERANCE) &&
      nclose(rationalRuntime.effect.end, 5005 / 30000, FRAME_SECONDS_TOLERANCE) &&
      nclose(rationalRuntime.effect.fixedStepSeconds, 1001 / 30000, FRAME_SECONDS_TOLERANCE),
  );

  const refuse: (
    overrides: Partial<Parameters<typeof AutoMovieEngineEffect.materializeProductionFilmEffects>[0]>,
  ) => string = (
    overrides: Partial<Parameters<typeof AutoMovieEngineEffect.materializeProductionFilmEffects>[0]>,
  ): string =>
    filmEffectRefusal((): IAutoMovieCompiledFilmEffect[] =>
      materialize(overrides),
    );
  TestValidator.equals(
    "a malformed identity or rate is refused as input",
    [
      refuse({ identity: { ...identity, compileFingerprint: "sha256:c" } }),
      refuse({ frameRate: 0 }),
      refuse({ frameRate: { numerator: 0, denominator: 1 } }),
    ],
    Array.from({ length: 3 }, (): string => "film-effect-input-invalid"),
  );
  const world: (
    patch: Partial<
      Pick<IAutoMovieWorldDesign, "effectRecipes" | "effectZones">
    >,
  ) => IAutoMovieWorldDesign = (
    patch: Partial<
      Pick<IAutoMovieWorldDesign, "effectRecipes" | "effectZones">
    >,
  ): IAutoMovieWorldDesign => ({ ...filmEffectWorld(), ...patch });
  TestValidator.equals(
    "duplicated world ids are refused",
    [
      refuse({
        world: world({
          effectRecipes: [filmEffectRecipe(), filmEffectRecipe()],
        }),
      }),
      refuse({
        world: world({
          effectZones: [filmEffectZone("yard"), filmEffectZone("yard")],
        }),
      }),
    ],
    Array.from({ length: 2 }, (): string => "film-effect-input-invalid"),
  );

  const interval: IAutoMovieShotEffectFilmInterval = {
    cue: "shot-cue",
    shot: "shot",
    zone: "moat",
    startFrame: 30,
    endFrame: 36,
  };
  TestValidator.equals(
    "a malformed shot interval is refused and a valid one accepted",
    [{ startFrame: -1 }, { endFrame: 30 }, {}].map(
      (
        patch:
          | {
              cue: string;
              shot?: undefined;
              zone?: undefined;
              startFrame?: undefined;
              endFrame?: undefined;
            }
          | {
              shot: string;
              cue?: undefined;
              zone?: undefined;
              startFrame?: undefined;
              endFrame?: undefined;
            }
          | {
              zone: string;
              cue?: undefined;
              shot?: undefined;
              startFrame?: undefined;
              endFrame?: undefined;
            }
          | {
              startFrame: number;
              cue?: undefined;
              shot?: undefined;
              zone?: undefined;
              endFrame?: undefined;
            }
          | {
              endFrame: number;
              cue?: undefined;
              shot?: undefined;
              zone?: undefined;
              startFrame?: undefined;
            }
          | {
              cue?: undefined;
              shot?: undefined;
              zone?: undefined;
              startFrame?: undefined;
              endFrame?: undefined;
            },
      ): string => refuse({ shotEffects: [{ ...interval, ...patch }] }),
    ),
    [
      ...Array.from({ length: 2 }, (): string => "film-effect-input-invalid"),
      "accepted",
    ],
  );

  const cue: (
    patch: Partial<{
      id: string;
      recipe: "world-zone";
      zone: string;
      startFrame: number;
      durationFrames: number;
      intensity: number;
    }>,
  ) => string = (
    patch: Partial<IAutoMovieFilmTimeline["tracks"]["effects"][number]>,
  ): string => refuse({ effects: [filmEffectCue(patch)] });
  TestValidator.equals(
    "a malformed cue is refused and the intensity bounds are accepted",
    [
      cue({ startFrame: -1 }),
      cue({ durationFrames: 0 }),
      cue({ startFrame: Number.MAX_SAFE_INTEGER, durationFrames: 1 }),
      cue({ intensity: -0.1 }),
      cue({ intensity: 1.1 }),
      cue({ intensity: 0 }),
      cue({ intensity: 1 }),
      refuse({
        effects: [
          filmEffectCue(),
          filmEffectCue({ zone: "gate", startFrame: 30 }),
        ],
      }),
    ],
    [
      ...Array.from({ length: 5 }, (): string => "film-effect-input-invalid"),
      "accepted",
      "accepted",
      "film-effect-input-invalid",
    ],
  );
  TestValidator.equals(
    "a missing zone and a missing recipe keep their own codes",
    [
      cue({ zone: "moat" }),
      refuse({
        effects: [filmEffectCue()],
        world: world({ effectZones: [filmEffectZone("yard", "smoke-recipe")] }),
      }),
    ],
    ["film-effect-zone-missing", "film-effect-recipe-missing"],
  );

  TestValidator.equals(
    "overlapping film cues on one zone are refused naming the frames",
    {
      sameZone: throwsError(
        (): IAutoMovieCompiledFilmEffect[] =>
          materialize({
            effects: [
              filmEffectCue(),
              filmEffectCue({ id: "fog", startFrame: 18 }),
            ],
          }),
        'Film effect cues "mist" and "fog" both own zone "yard" during frames 18..24.',
      ),
      otherZone: refuse({
        effects: [
          filmEffectCue(),
          filmEffectCue({ id: "fog", zone: "gate", startFrame: 18 }),
        ],
      }),
    },
    { sameZone: true, otherZone: "accepted" },
  );
  TestValidator.equals(
    "a film cue overlapping a shot interval on its zone is refused",
    {
      overlapping: throwsError(
        (): IAutoMovieCompiledFilmEffect[] =>
          materialize({
            effects: [filmEffectCue()],
            shotEffects: [
              { ...interval, zone: "yard", startFrame: 20, endFrame: 26 },
            ],
          }),
        'Film effect cue "mist" and shot effect cue "shot-cue" on shot "shot" both own zone "yard" during frames 20..24.',
      ),
      touching: [
        { startFrame: 24, endFrame: 30 },
        { startFrame: 0, endFrame: 12 },
        { startFrame: 30, endFrame: 36 },
      ].map((frames: { startFrame: number; endFrame: number }): string =>
        refuse({
          effects: [filmEffectCue()],
          shotEffects: [{ ...interval, zone: "yard", ...frames }],
        }),
      ),
    },
    { overlapping: true, touching: ["accepted", "accepted", "accepted"] },
  );

  // An identity carrying a field it does not declare persists the very same
  // runtime, digest included, as the declared identity alone: the whole
  // record is compared, so a leaked field is a difference.
  const noted: typeof identity & { note: string } = {
    ...identity,
    note: "not an identity field",
  };
  TestValidator.equals(
    "only the four identity fields reach the persisted runtime",
    materialize({ identity: noted })[0]!,
    output[0]!,
  );
}
