import {
  sampleCompiledEffect,
  sampleProductionFilmEffects,
} from "@automovie/engine";
import {
  IAutoMovieCompiledFilmEffect,
  type IAutoMovieEffectSample,
  type IAutoMovieFilmEffectCurrentIdentity,
  IAutoMovieFilmTimeline,
  type IAutoMovieProductionFilmEffectSample,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectValuesClose } from "../../../internal/filmEffectValuesClose";
import { nclose } from "../../../internal/nclose";
import { filmEffectIdentity } from "../../../internal/filmEffectIdentity";
import { filmEffectRefusal } from "../../../internal/filmEffectRefusal";
import { filmEffectTimeline } from "../../../internal/filmEffectTimeline";
import { materializedFilmEffects } from "../../../internal/materializedFilmEffects";
import { resealFilmEffect } from "../../../internal/resealFilmEffect";

/**
 * Film sampling preserves half-open cue ownership and rejects stale or malformed runtime data.
 *
 * Scenarios:
 * 1. Sample inside/outside cue frames, reordered seeks, copied runtime and an empty population.
 * 2. Refuse malformed identity/frame/distance and distinguish stale owner identities.
 * 3. Refuse invalid versions, clocks, intervals, digests and canonical data while accepting an unchanged reseal.
 *
 */
export function test_unit_engine_film_effect_runtime_sampling(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline();
  const identity: IAutoMovieFilmEffectCurrentIdentity =
    filmEffectIdentity(timeline);
  const effects: IAutoMovieCompiledFilmEffect[] =
    materializedFilmEffects(timeline);
  const [haze, mist]: [
    IAutoMovieCompiledFilmEffect,
    IAutoMovieCompiledFilmEffect,
  ] = effects as [IAutoMovieCompiledFilmEffect, IAutoMovieCompiledFilmEffect];
  const sample: (
    timelineFrame: number,
    cameraDistance?: number | undefined,
    candidates?: readonly IAutoMovieCompiledFilmEffect[],
    current?: IAutoMovieFilmEffectCurrentIdentity,
  ) => IAutoMovieProductionFilmEffectSample[] = (
    timelineFrame: number,
    cameraDistance?: number,
    candidates: readonly IAutoMovieCompiledFilmEffect[] = effects,
    current: IAutoMovieFilmEffectCurrentIdentity = identity,
  ): IAutoMovieProductionFilmEffectSample[] =>
    sampleProductionFilmEffects({
      identity: current,
      effects: candidates,
      timelineFrame,
      cameraDistance,
    });

  TestValidator.equals(
    "active windows follow the half-open cue frames",
    [11, 12, 23, 24, 0, 6].map((frame: number): boolean[] =>
      sample(frame).map(
        (item: IAutoMovieProductionFilmEffectSample): boolean =>
          item.sample.active,
      ),
    ),
    [
      [false, false],
      [false, true],
      [false, true],
      [false, false],
      [true, false],
      [false, false],
    ],
  );
  TestValidator.predicate(
    "each sample is the engine sample at the exact frame second",
    filmEffectValuesClose(
      sample(12, 3).map(
        (item: IAutoMovieProductionFilmEffectSample): IAutoMovieEffectSample =>
          item.sample,
      ),
      [
        sampleCompiledEffect(haze.effect, 12 / 24, 3),
        sampleCompiledEffect(mist.effect, 12 / 24, 3),
      ],
    ),
  );
  const boundary: IAutoMovieProductionFilmEffectSample[] = sample(12, 3);
  TestValidator.predicate(
    "frame twelve samples half a second with mist's authored constant intensity",
    boundary.length === 2 &&
      boundary.every((item: IAutoMovieProductionFilmEffectSample): boolean =>
        nclose(item.sample.time, 0.5),
      ) &&
      nclose(boundary[0]!.sample.intensity, 0) &&
      nclose(boundary[1]!.sample.intensity, 0.5),
  );
  const late: IAutoMovieProductionFilmEffectSample[] = sample(23);
  const early: IAutoMovieProductionFilmEffectSample[] = sample(12);
  TestValidator.predicate(
    "reordered seeks reconstruct the same state",
    filmEffectValuesClose([sample(23), sample(12)], [late, early]),
  );
  const copied: IAutoMovieProductionFilmEffectSample[] = sample(12);
  copied[1]!.runtime.effect.id = "mutated";
  TestValidator.equals(
    "the returned runtime is a copy and an empty population samples empty",
    [mist.effect.id, sample(0, undefined, [])],
    ["mist", []],
  );

  const refusal: (task: () => unknown) => string = (
    task: () => unknown,
  ): string => filmEffectRefusal(task);
  TestValidator.equals(
    "malformed identity, frame and distance are refused as input",
    [
      refusal((): IAutoMovieProductionFilmEffectSample[] =>
        sample(0, undefined, [], {
          ...identity,
          compileFingerprint: `sha256:${"C".repeat(64)}`,
        }),
      ),
      refusal((): IAutoMovieProductionFilmEffectSample[] =>
        sample(0, undefined, [], {
          ...identity,
          editFingerprint: `sha256:${"a".repeat(63)}`,
        }),
      ),
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(-1)),
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(0, -0.1)),
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(0, 0)),
    ],
    [
      ...Array.from({ length: 4 }, (): string => "film-effect-input-invalid"),
      "accepted",
    ],
  );
  TestValidator.equals(
    "a runtime for another identity is stale",
    (
      [
        { ...identity, production: "other" },
        { ...identity, film: "other" },
        { ...identity, compileFingerprint: `sha256:${"1".repeat(64)}` },
        { ...identity, editFingerprint: `sha256:${"2".repeat(64)}` },
      ] satisfies IAutoMovieFilmEffectCurrentIdentity[]
    ).map(
      (current: {
        production: string;
        film: string;
        compileFingerprint: string;
        editFingerprint: string;
      }): string =>
        refusal((): IAutoMovieProductionFilmEffectSample[] =>
          sample(0, undefined, effects, current),
        ),
    ),
    Array.from({ length: 4 }, (): string => "film-effect-runtime-stale"),
  );

  const malformed: IAutoMovieCompiledFilmEffect[] = [
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      (draft as { version: number }).version = 2;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      (draft as { owner: string }).owner = "shot";
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      (draft as { clock: string }).clock = "output-frame";
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.startFrame = -1;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.endFrame = draft.startFrame;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.endFrame = 2 ** 53;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.frameRate = { numerator: 0, denominator: 1 };
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.frameRate = { numerator: 48, denominator: 2 };
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      (draft.effect as { version: number }).version = 2;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.intensity = { from: 0.5, to: 0.25 };
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.intensity = { from: -0.5, to: -0.5 };
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.intensity = { from: 1.5, to: 1.5 };
    }),
    {
      ...mist,
      effect: { ...mist.effect, digest: `sha256:${"3".repeat(64)}` },
    },
    { ...mist, digest: `sha256:${"4".repeat(64)}` },
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.start = 0.51;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.end = 1.01;
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.fixedStepSeconds = 0.05;
    }),
    // Canonical JSON refuses this value, so it cannot be resealed; the
    // validator must still classify it under its own refusal code.
    {
      ...mist,
      effect: {
        ...mist.effect,
        recipe: { ...mist.effect.recipe, id: "\ud800" },
      },
    },
  ];
  TestValidator.equals(
    "a runtime the builder would not write is refused as invalid",
    [
      ...malformed.map((runtime: IAutoMovieCompiledFilmEffect): string =>
        refusal((): IAutoMovieProductionFilmEffectSample[] =>
          sample(12, undefined, [runtime]),
        ),
      ),
      refusal((): IAutoMovieProductionFilmEffectSample[] =>
        sample(12, undefined, [resealFilmEffect(mist, (): void => {})]),
      ),
    ],
    [...malformed.map((): string => "film-effect-runtime-invalid"), "accepted"],
  );
}
