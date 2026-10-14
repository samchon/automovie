import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { IAutoMovieFilmEffectCurrentIdentity } from "../../../../packages/engine/src/effectRuntime/IAutoMovieFilmEffectCurrentIdentity";
import { IAutoMovieCompiledFilmEffect, IAutoMovieWorldEffectZone, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate, IAutoMovieWorldDesign } from "@automovie/interface";
import { type IAutoMovieShotEffectFilmInterval } from "../../../../packages/engine/src/effectRuntime/IAutoMovieShotEffectFilmInterval";
import { materializeProductionFilmEffects } from "../../../../packages/engine/src/effectRuntime/materializeProductionFilmEffects";
import { verifyProductionFilmEffectPopulation } from "../../../../packages/engine/src/effectRuntime/verifyProductionFilmEffectPopulation";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/predicates";
import { filmEffectCue, filmEffectIdentity, filmEffectRecipe, filmEffectRefusal, filmEffectTimeline, filmEffectWorld, filmEffectZone, nodeCanonicalDigest } from "./filmEffectRuntimeFixtures";
/**
 * Film cue materialization enforces current identity, rational clock and exclusive zone ownership.
 *
 * Scenarios:
 * 1. Check canonical ordering, identity, frames, rational seconds, protocol seeds/digests and reader acceptance.
 * 2. Refuse invalid identity/rate, duplicate world ids, malformed intervals/cues and missing zone/recipe.
 * 3. Distinguish same-zone overlap from touching intervals or different zones, and preserve only declared runtime fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs materializeProductionFilmEffects and the population verifier, checking observable fields and named refusal classes; overlapping cues must name their common frames and invalid input must not become a partial runtime set.
 * @evidence contracts/testing.md#independent-expectations Authored half-open frame intervals and rational rates independently determine seconds and ownership; protocol records and Node SHA-256 determine seeds/digests. The shared canonicalizer limits independence to hashing, and reader acceptance is a producer/consumer consistency check.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all original identity/rate/world-id/shot-interval/cue admission cases, zero/one intensities, code-unit ties, missing references, film-film and film-shot overlaps with touching/different-zone twins, rational clock and extra-field exclusion.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable function owns its in-memory writer/reader cases and Node reference hashing. It starts no generated production, native renderer, browser or GPU, and does not prove cross-machine replay.
 */
export function test_film_effect_materialization(): void {
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
  const identity: IAutoMovieFilmEffectCurrentIdentity = filmEffectIdentity(timeline);
  const materialize: (overrides: Partial<Parameters<typeof materializeProductionFilmEffects>[0]>) => IAutoMovieCompiledFilmEffect[] = (
    overrides: Partial<Parameters<typeof materializeProductionFilmEffects>[0]>,
  ): IAutoMovieCompiledFilmEffect[] =>
    materializeProductionFilmEffects({
      identity,
      frameRate: 24,
      world: filmEffectWorld(),
      effects: timeline.tracks.effects,
      ...overrides,
    });
  const output: IAutoMovieCompiledFilmEffect[] = materialize({});
  const zoneOf: (id: string) => IAutoMovieWorldEffectZone = (id: string): IAutoMovieWorldEffectZone =>
    filmEffectWorld().effectZones.find((zone: IAutoMovieWorldEffectZone): boolean => zone.id === id)!;

  TestValidator.predicate(
    "cues become ordered runtimes on their exact frame clock",
    filmEffectValuesClose(
      output.map((runtime: IAutoMovieCompiledFilmEffect): { id: string; zone: string; owner: (string | number)[]; identity: string[]; rate: IAutoMovieProductionFrameRate; frames: number[]; seconds: number[]; step: number; intensity: { from: number; to: number; }; } => ({
      id: runtime.effect.id,
      zone: runtime.effect.zone,
      owner: [runtime.version, runtime.owner, runtime.clock] as Array<
        string | number
      >,
      identity: [
        runtime.production,
        runtime.film,
        runtime.compileFingerprint,
        runtime.editFingerprint,
      ],
      rate: runtime.frameRate,
      frames: [runtime.startFrame, runtime.endFrame],
      seconds: [runtime.effect.start, runtime.effect.end],
      step: runtime.effect.fixedStepSeconds,
      intensity: runtime.effect.intensity,
    })),
      [
      ["haze", "gate", 0, 6, 1],
      ["mist", "yard", 12, 24, 0.5],
      ["dew", "yard", 24, 30, 0.5],
    ].map(([id, zone, start, end, intensity]: (string | number)[]): { id: string; zone: string; owner: (string | number)[]; identity: string[]; rate: { numerator: number; denominator: number; }; frames: number[]; seconds: number[]; step: number; intensity: { from: number; to: number; }; } => ({
      id: id as string,
      zone: zone as string,
      owner: [1, "film", "timeline-frame"],
      identity: [
        "production",
        "film",
        timeline.inputFingerprint,
        identity.editFingerprint,
      ],
      rate: { numerator: 24, denominator: 1 },
      frames: [start as number, end as number],
      seconds: [(start as number) / 24, (end as number) / 24],
      step: 1 / 24,
      intensity: { from: intensity as number, to: intensity as number },
    })),
    ),
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
      verifyProductionFilmEffectPopulation({ timeline, effects: output }),
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
    }).map((runtime: IAutoMovieCompiledFilmEffect): string => runtime.effect.id),
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
  TestValidator.predicate(
    "a rational clock yields exact rational bounds",
    filmEffectValuesClose(
      [
      rationalRuntime.frameRate,
      rationalRuntime.effect.start,
      rationalRuntime.effect.end,
      rationalRuntime.effect.fixedStepSeconds,
    ],
      [rational, 3003 / 30000, 5005 / 30000, 1001 / 30000],
    ),
  );

  const refuse: (overrides: Partial<Parameters<typeof materializeProductionFilmEffects>[0]>) => string = (
    overrides: Partial<Parameters<typeof materializeProductionFilmEffects>[0]>,
  ): string => filmEffectRefusal((): IAutoMovieCompiledFilmEffect[] => materialize(overrides));
  TestValidator.equals(
    "a malformed identity or rate is refused as input",
    [
      refuse({ identity: { ...identity, production: "" } }),
      refuse({ identity: { ...identity, film: " " } }),
      refuse({ identity: { ...identity, compileFingerprint: "sha256:c" } }),
      refuse({
        identity: {
          ...identity,
          editFingerprint: `md5:${"0".repeat(64)}` as `sha256:${string}`,
        },
      }),
      refuse({ frameRate: 0 }),
      refuse({ frameRate: 23.976 }),
      refuse({ frameRate: { numerator: 0, denominator: 1 } }),
    ],
    Array.from({ length: 7 }, (): string => "film-effect-input-invalid"),
  );
  const world: (patch: Partial<Pick<IAutoMovieWorldDesign, "effectRecipes" | "effectZones">>) => IAutoMovieWorldDesign = (
    patch: Partial<
      Pick<IAutoMovieWorldDesign, "effectRecipes" | "effectZones">
    >,
  ): IAutoMovieWorldDesign => ({ ...filmEffectWorld(), ...patch });
  TestValidator.equals(
    "blank or duplicated world ids are refused",
    [
      refuse({ world: world({ effectRecipes: [filmEffectRecipe(" ")] }) }),
      refuse({
        world: world({
          effectRecipes: [filmEffectRecipe(), filmEffectRecipe()],
        }),
      }),
      refuse({ world: world({ effectZones: [filmEffectZone("")] }) }),
      refuse({
        world: world({
          effectZones: [filmEffectZone("yard"), filmEffectZone("yard")],
        }),
      }),
    ],
    Array.from({ length: 4 }, (): string => "film-effect-input-invalid"),
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
    [
      { cue: " " },
      { shot: "" },
      { zone: " " },
      { startFrame: -1 },
      { startFrame: 30.5 },
      { endFrame: 36.5 },
      { endFrame: 30 },
      {},
    ].map((patch: { cue: string; shot?: undefined; zone?: undefined; startFrame?: undefined; endFrame?: undefined; } | { shot: string; cue?: undefined; zone?: undefined; startFrame?: undefined; endFrame?: undefined; } | { zone: string; cue?: undefined; shot?: undefined; startFrame?: undefined; endFrame?: undefined; } | { startFrame: number; cue?: undefined; shot?: undefined; zone?: undefined; endFrame?: undefined; } | { endFrame: number; cue?: undefined; shot?: undefined; zone?: undefined; startFrame?: undefined; } | { cue?: undefined; shot?: undefined; zone?: undefined; startFrame?: undefined; endFrame?: undefined; }): string => refuse({ shotEffects: [{ ...interval, ...patch }] })),
    [
      ...Array.from({ length: 7 }, (): string => "film-effect-input-invalid"),
      "accepted",
    ],
  );

  const cue: (patch: Partial<{ id: string; recipe: "world-zone"; zone: string; startFrame: number; durationFrames: number; intensity: number; }>) => string = (
    patch: Partial<IAutoMovieFilmTimeline["tracks"]["effects"][number]>,
  ): string => refuse({ effects: [filmEffectCue(patch)] });
  TestValidator.equals(
    "a malformed cue is refused and the intensity bounds are accepted",
    [
      cue({ id: " " }),
      cue({ recipe: "shot-zone" as "world-zone" }),
      cue({ zone: "" }),
      cue({ startFrame: -1 }),
      cue({ startFrame: 0.5 }),
      cue({ durationFrames: 1.5 }),
      cue({ durationFrames: 0 }),
      cue({ startFrame: Number.MAX_SAFE_INTEGER, durationFrames: 1 }),
      cue({ intensity: Number.NaN }),
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
      ...Array.from({ length: 11 }, (): string => "film-effect-input-invalid"),
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
      ].map((frames: { startFrame: number; endFrame: number; }): string =>
        refuse({
          effects: [filmEffectCue()],
          shotEffects: [{ ...interval, zone: "yard", ...frames }],
        }),
      ),
    },
    { overlapping: true, touching: ["accepted", "accepted", "accepted"] },
  );

  TestValidator.equals(
    "only the four identity fields reach the persisted runtime",
    Object.keys(
      materialize({
        identity: {
          ...identity,
          note: "not an identity field",
        } as typeof identity,
      })[0]!,
    ).sort((left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
    [
      "clock",
      "compileFingerprint",
      "digest",
      "editFingerprint",
      "effect",
      "endFrame",
      "film",
      "frameRate",
      "owner",
      "production",
      "startFrame",
      "version",
    ],
  );
}
