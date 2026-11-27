import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../../film/internal/productionFrameBoundaryToSeconds";
import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineCanonicalJsonError } from "../../text/AutoMovieEngineCanonicalJsonError";
import { AutoMovieEngineCanonicalJson } from "../../text/AutoMovieEngineCanonicalJson";
import { AutoMovieFilmEffectRuntimeError } from "../AutoMovieFilmEffectRuntimeError";
import { productionFilmEffectFrameRate } from "./productionFilmEffectFrameRate";

/*
 * Check semantic integrity of a structurally admitted persisted film-effect
 * runtime.
 *
 * Version, owner, clock, half-open safe-integer interval, reduced frame rate,
 * inner effect id, zone and constant intensity in [0,1], both content digests,
 * and the exact frame clock of the inner stream must match. Production's
 * persisted JSON parser owns schema admission first; direct typed callers must
 * supply populated outer/effect/intensity records and string identities. Under
 * that premise the explicit refusals use film-effect-runtime-invalid, including
 * canonical-JSON failures. Malformed host shapes and unexpected accessors can
 * throw outside that named boundary. Identity currentness is checked separately
 * against independently established facts.
 *
 * Both digests are recomputed with the engine's canonical JSON and pure
 * SHA-256, which produce the same bytes and digest as the Node builder path, so
 * a browser and the builder accept or refuse the same persisted runtime.
 */
export function validateProductionFilmEffectRuntime(
  runtime: IAutoMovieCompiledFilmEffect,
): void {
  if (
    runtime.version !== 1 ||
    runtime.owner !== "film" ||
    runtime.clock !== "timeline-frame" ||
    runtime.startFrame < 0 ||
    runtime.endFrame <= runtime.startFrame
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-runtime-invalid",
      `Film effect runtime "${runtime.effect.id}" has an unsupported version, owner, clock, or interval.`,
    );
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectFrameRate(
      runtime.frameRate,
      "film-effect-runtime-invalid",
    );
  if (
    runtime.frameRate.numerator !== frameRate.numerator ||
    runtime.frameRate.denominator !== frameRate.denominator ||
    runtime.effect.version !== 1 ||
    runtime.effect.intensity.from !== runtime.effect.intensity.to ||
    runtime.effect.intensity.from < 0 ||
    runtime.effect.intensity.from > 1
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-runtime-invalid",
      `Film effect runtime "${runtime.effect.id}" has a noncanonical frame rate or malformed inner film effect.`,
    );
  const expectedEffectDigest: string = recomputedDigest(runtime, {
    ...runtime.effect,
    digest: undefined,
  });
  const expectedRuntimeDigest: string = recomputedDigest(runtime, {
    ...runtime,
    digest: undefined,
  });
  if (
    runtime.effect.digest !== expectedEffectDigest ||
    runtime.digest !== expectedRuntimeDigest ||
    runtime.effect.start !==
      productionFrameBoundaryToSeconds({
        frame: runtime.startFrame,
        frameRate,
      }) ||
    runtime.effect.end !==
      productionFrameBoundaryToSeconds({
        frame: runtime.endFrame,
        frameRate,
      }) ||
    runtime.effect.fixedStepSeconds !==
      frameRate.denominator / frameRate.numerator
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-runtime-invalid",
      `Film effect runtime "${runtime.effect.id}" differs from its content digest or exact frame clock.`,
    );
}

/*
 * Digest one record, refusing a value canonical JSON cannot encode.
 */
function recomputedDigest(
  runtime: IAutoMovieCompiledFilmEffect,
  value: object,
): string {
  try {
    return autoMovieRenderDigest(
      AutoMovieEngineCanonicalJson.canonicalize(value),
    );
  } catch (error) {
    if (error instanceof AutoMovieEngineCanonicalJsonError)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-runtime-invalid",
        `Film effect runtime "${runtime.effect.id}" holds a value canonical JSON cannot encode: ${error.message}`,
      );
    throw error;
  }
}
