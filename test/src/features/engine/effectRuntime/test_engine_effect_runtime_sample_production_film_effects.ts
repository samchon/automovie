import { AutoMovieEngineFilmEffectRuntimeError, AutoMovieEngineEffect } from "@automovie/engine";
import type {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmEffectCurrentIdentity,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFilmEffectSample,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectIdentity } from "../../internal/filmEffectIdentity";
import { filmEffectTimeline } from "../../internal/filmEffectTimeline";
import { materializedFilmEffects } from "../../internal/materializedFilmEffects";

/** The code a refused sampling carries, or null when it succeeds. */
const refusal: (
  identity: IAutoMovieFilmEffectCurrentIdentity,
  effects: IAutoMovieCompiledFilmEffect[],
  timelineFrame: number,
) => string | null = (
  identity: IAutoMovieFilmEffectCurrentIdentity,
  effects: IAutoMovieCompiledFilmEffect[],
  timelineFrame: number,
): string | null => {
  try {
    AutoMovieEngineEffect.sampleProductionFilmEffects({ identity, effects, timelineFrame });
    return null;
  } catch (error) {
    return error instanceof AutoMovieEngineFilmEffectRuntimeError ? error.code : null;
  }
};

/**
 * `sampleProductionFilmEffects` samples each current runtime at a timeline
 * frame, returning a copy of the runtime beside its sample.
 *
 * Scenarios, on the two-cue film:
 *
 * 1. One sample per runtime, in input order, each carrying an equal copy of its
 *    runtime and not the same record.
 * 2. A negative timeline frame is refused as invalid input.
 * 3. An identity whose edit fingerprint differs from the runtimes' is refused as
 *    stale.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines input-order film-runtime samples, owned equal records and refusal of invalid frame or stale identity.
 * @evidence contracts/development/testing.md#behavioral-verification Samples a prepared two-runtime film, compares values and identities, then tries a negative frame and mismatched edit identifier.
 * @evidence contracts/development/testing.md#independent-expectations The two source runtimes supply expected order and contents with separate object identity. Negative frame and changed ownership produce distinct defined refusals.
 */
export function test_engine_effect_runtime_sample_production_film_effects(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline();
  const identity: IAutoMovieFilmEffectCurrentIdentity =
    filmEffectIdentity(timeline);
  const effects: IAutoMovieCompiledFilmEffect[] =
    materializedFilmEffects(timeline);
  const samples: IAutoMovieProductionFilmEffectSample[] =
    AutoMovieEngineEffect.sampleProductionFilmEffects({
      identity,
      effects,
      timelineFrame: 18,
    });
  TestValidator.equals(
    "one equal copy per runtime",
    samples.map(
      (
        entry: IAutoMovieProductionFilmEffectSample,
      ): IAutoMovieCompiledFilmEffect => entry.runtime,
    ),
    effects,
  );
  TestValidator.predicate(
    "copies, not the same records",
    samples.every(
      (entry: IAutoMovieProductionFilmEffectSample, index: number): boolean =>
        entry.runtime !== effects[index],
    ),
  );
  TestValidator.equals(
    "a negative frame",
    refusal(identity, effects, -1),
    "film-effect-input-invalid",
  );
  TestValidator.equals(
    "a stale identity",
    refusal(
      { ...identity, editFingerprint: `sha256:${"1".repeat(64)}` },
      effects,
      18,
    ),
    "film-effect-runtime-stale",
  );
}
