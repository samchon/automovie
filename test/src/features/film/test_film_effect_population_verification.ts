import { verifyProductionFilmEffectPopulation } from "@automovie/engine";
import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  filmEffectRefusal,
  filmEffectTimeline,
  materializedFilmEffects,
  resealFilmEffect,
} from "./filmEffectRuntimeFixtures";

/**
 * The persisted effect population must match the complete current cue set.
 *
 * Scenarios:
 * 1. Accept current, unchanged resealed and empty-track populations and ignore source provenance alone.
 * 2. Refuse missing, extra, empty or reordered entries.
 * 3. Refuse digest-valid field retargeting, malformed runtime version and inconsistent timeline clock.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls verifyProductionFilmEffectPopulation through its named refusal boundary and checks accepted versus invalid-input/runtime classes, catching an individually valid but incomplete, reordered or retargeted population.
 * @evidence contracts/testing.md#independent-expectations The authored cue set requires one entry per cue in start-frame/id order with matching identity, rate, interval and intensity. Resealing recomputes digests so mutations reach field comparisons; it is not an independent digest correctness oracle.
 * @evidence contracts/testing.md#distinguishing-cases Keeps current/empty/resealed/provenance-only neighbours and every original cardinality/order/identity/clock/id/zone/frame/intensity mutation. Production identity, absent from a timeline, is owned by sampler identity checks.
 * @evidence contracts/testing.md#execution-ownership The discoverable portable synchronous entry owns all mutation cases, using existing data factories and real verifier source without installation, a render host or a browser.
 */
export function test_film_effect_population_verification(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline();
  const effects: IAutoMovieCompiledFilmEffect[] =
    materializedFilmEffects(timeline);
  const [haze, mist]: [
    IAutoMovieCompiledFilmEffect,
    IAutoMovieCompiledFilmEffect,
  ] = effects as [IAutoMovieCompiledFilmEffect, IAutoMovieCompiledFilmEffect];
  const verify: (
    candidate: readonly IAutoMovieCompiledFilmEffect[],
    current?: IAutoMovieFilmTimeline,
  ) => string = (
    candidate: readonly IAutoMovieCompiledFilmEffect[],
    current: IAutoMovieFilmTimeline = timeline,
  ): string =>
    filmEffectRefusal((): void =>
      verifyProductionFilmEffectPopulation({
        timeline: current,
        effects: candidate,
      }),
    );

  TestValidator.equals(
    "the current population and its empty twin verify",
    [
      verify(effects),
      verify([], filmEffectTimeline([])),
      verify([haze, resealFilmEffect(mist, (): void => {})]),
      verify(effects, {
        ...timeline,
        sourceDigest: `sha256:${"9".repeat(64)}`,
      }),
    ],
    ["accepted", "accepted", "accepted", "accepted"],
  );
  TestValidator.equals(
    "an incomplete, extended, or reordered population is refused",
    [
      verify([haze]),
      verify([haze, mist, mist]),
      verify([]),
      verify([mist, haze]),
    ],
    [
      "film-effect-runtime-invalid",
      "film-effect-runtime-invalid",
      "film-effect-runtime-invalid",
      "film-effect-runtime-invalid",
    ],
  );

  const retargeted: Array<(draft: IAutoMovieCompiledFilmEffect) => void> = [
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.film = "other-film";
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.compileFingerprint = `sha256:${"e".repeat(64)}`;
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.editFingerprint = `sha256:${"f".repeat(64)}`;
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.frameRate = { numerator: 25, denominator: 1 };
      draft.effect.start = 12 / 25;
      draft.effect.end = 24 / 25;
      draft.effect.fixedStepSeconds = 1 / 25;
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.id = "fog";
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.zone = "gate";
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.startFrame = 13;
      draft.effect.start = 13 / 24;
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.endFrame = 25;
      draft.effect.end = 25 / 24;
    },
    (draft: IAutoMovieCompiledFilmEffect): void => {
      draft.effect.intensity = { from: 0.75, to: 0.75 };
    },
  ];
  TestValidator.equals(
    "a digest-valid runtime that differs from its cue or identity is refused",
    [
      ...retargeted.map(
        (mutate: (draft: IAutoMovieCompiledFilmEffect) => void): string =>
          verify([haze, resealFilmEffect(mist, mutate)]),
      ),
      verify(effects, {
        ...timeline,
        inputFingerprint: `sha256:${"e".repeat(64)}`,
      }),
      verify(effects, { ...timeline, totalFrames: 49 }),
    ],
    [...retargeted, "compile", "edit"].map(
      (): string => "film-effect-runtime-invalid",
    ),
  );
  TestValidator.equals(
    "shape and clock refusals keep their own classes",
    [
      verify([
        haze,
        resealFilmEffect(mist, (draft: IAutoMovieCompiledFilmEffect): void => {
          (draft as { version: number }).version = 2;
        }),
      ]),
      verify(effects, {
        ...timeline,
        frameRate: { numerator: 25, denominator: 1 },
      }),
    ],
    ["film-effect-runtime-invalid", "film-effect-input-invalid"],
  );
}
