import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieEffectSample } from "../../../../packages/engine/src/IAutoMovieEffectSample";
import { type IAutoMovieFilmEffectCurrentIdentity } from "../../../../packages/engine/src/effectRuntime/IAutoMovieFilmEffectCurrentIdentity";
import { IAutoMovieProductionFilmEffectSample } from "../../../../packages/engine/src/effectRuntime/IAutoMovieProductionFilmEffectSample";
import { sampleProductionFilmEffects } from "../../../../packages/engine/src/effectRuntime/sampleProductionFilmEffects";
import { sampleCompiledEffect } from "../../../../packages/engine/src/sampleCompiledEffect";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { nclose } from "../internal/nclose";
import {
  filmEffectIdentity,
  filmEffectRefusal,
  filmEffectTimeline,
  materializedFilmEffects,
  resealFilmEffect,
} from "./filmEffectRuntimeFixtures";

/**
 * Film sampling preserves half-open cue ownership and rejects stale or malformed runtime data.
 *
 * Scenarios:
 * 1. Sample inside/outside cue frames, reordered seeks, copied runtime and an empty population.
 * 2. Refuse malformed identity/frame/distance and distinguish stale owner identities.
 * 3. Refuse invalid versions, clocks, intervals, digests and canonical data while accepting an unchanged reseal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sampleProductionFilmEffects and observes active flags, numerical samples, seek replay, copy isolation and refusal codes, catching wrong boundary conversion or trust classification before particle sampling.
 * @evidence contracts/testing.md#independent-expectations Hand-authored frames define the expected half-open active matrix. Comparing with sampleCompiledEffect at frame/24 checks adapter clock/distance forwarding within filmEffectValuesClose's 1e-12 tolerance, not the shared particle arithmetic independently; direct clock/intensity checks use authored expectations with nclose's 1e-6 tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all original half-open boundaries, reordered seeks, empty/copy cases, invalid coordinates/identity, four stale identities, malformed runtime/inner fields, digest tampering, inconsistent seconds and noncanonical data with unchanged reseal accepted.
 * @evidence contracts/testing.md#execution-ownership This synchronous discoverable entry owns portable sampling cases in memory and uses no browser, GPU or runtime installation. Equal seeks within one process are scheduling witnesses, not cross-host rendering evidence.
 */
export function test_film_effect_runtime_sampling(): void {
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
        sample(0, undefined, [], { ...identity, production: " " }),
      ),
      refusal((): IAutoMovieProductionFilmEffectSample[] =>
        sample(0, undefined, [], { ...identity, film: "" }),
      ),
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
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(1.5)),
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(Number.NaN)),
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(0, -0.1)),
      refusal((): IAutoMovieProductionFilmEffectSample[] =>
        sample(0, Number.POSITIVE_INFINITY),
      ),
      refusal((): IAutoMovieProductionFilmEffectSample[] =>
        sample(0, Number.NaN),
      ),
      refusal((): IAutoMovieProductionFilmEffectSample[] => sample(0, 0)),
    ],
    [
      ...Array.from({ length: 10 }, (): string => "film-effect-input-invalid"),
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
      draft.startFrame = 1.5;
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
      draft.effect.id = " ";
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.zone = "";
    }),
    resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.intensity = { from: 0.5, to: 0.25 };
    }),
    // Canonical JSON cannot digest an infinite number, and the shape check
    // refuses it before any digest is recomputed, so this one is not resealed.
    {
      ...mist,
      effect: {
        ...mist.effect,
        intensity: {
          from: Number.POSITIVE_INFINITY,
          to: Number.POSITIVE_INFINITY,
        },
      },
    },
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
    // Canonical JSON refuses these values, so neither can be resealed; the
    // validator must still classify them under its own refusal code.
    {
      ...mist,
      effect: {
        ...mist.effect,
        recipe: { ...mist.effect.recipe, id: "\ud800" },
      },
    },
    {
      ...mist,
      effect: {
        ...mist.effect,
        bounds: {
          ...mist.effect.bounds,
          min: { ...mist.effect.bounds.min, x: Number.NaN },
        },
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
