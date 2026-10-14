import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { AutoMovieCanonicalJsonError } from "../text/AutoMovieCanonicalJsonError";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { productionFilmEffectFrameRate } from "./productionFilmEffectFrameRate";

/**
 * Check semantic integrity of a structurally admitted persisted film-effect runtime.
 *
 * Version, owner, clock, half-open safe-integer interval, reduced frame rate, inner effect id, zone and constant intensity in [0,1], both content digests, and the exact frame clock of the inner stream must match. Production's persisted JSON parser owns schema admission first; direct typed callers must supply populated outer/effect/intensity records and string identities. Under that premise the explicit refusals use film-effect-runtime-invalid, including canonical-JSON failures. Malformed host shapes and unexpected accessors can throw outside that named boundary. Identity currentness is checked separately against independently established facts.
 *
 * Both digests are recomputed with the engine's canonical JSON and pure SHA-256, which produce the same bytes and digest as the Node builder path, so a browser and the builder accept or refuse the same persisted runtime.
 *
 * @evidence contracts/common.md#principled-implementation Integrity by recomputation: the digests are rebuilt from the canonical JSON of the record with its own digest member omitted, and the window and step are recomputed from the frames by `productionFrameBoundaryToSeconds` and `denominator / numerator`, the same float expressions the materializer evaluated, so exact equality is the right comparison.
 * @evidence contracts/common.md#clear-and-simple-design Owns semantic runtime integrity after caller schema admission, leaving currentness to the sampler and population verifier. Explicit version/interval/rate checks precede hashing; this typed API is not a second unknown-input schema parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is repaired or defaulted, and only `AutoMovieCanonicalJsonError` is translated, because a value the canonicalizer refuses is by definition not a written runtime; any other exception still propagates.
 * @evidence contracts/common.md#meaningful-documentation States every property checked, that unencodable values are refused, the one refusal code, that currentness is out of scope, and that browser and builder agree on the digests.
 * @evidence contracts/performance.md#efficient-algorithms Two canonicalizations traverse and serialize the records, sorting each object's K keys with sum(K log K) work, followed by two linear SHA-256 byte passes; the inner effect is serialized twice. The remaining work includes one logarithmic rate reduction.
 * @evidence contracts/performance.md#reuse-equivalent-work Not cached: callers hold mutable runtime records with no version token, so a previous verdict on the same object could be stale; the sampler and the verifier each validate once per entry per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the two canonical strings only during the call and retains nothing.
 */
export function validateProductionFilmEffectRuntime(
  runtime: IAutoMovieCompiledFilmEffect,
): void {
  if (
    runtime.version !== 1 ||
    runtime.owner !== "film" ||
    runtime.clock !== "timeline-frame" ||
    runtime.startFrame < 0 ||
    runtime.endFrame <= runtime.startFrame ||
    Number.isSafeInteger(runtime.startFrame) === false ||
    Number.isSafeInteger(runtime.endFrame) === false
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
    runtime.effect.id.trim().length === 0 ||
    runtime.effect.zone.trim().length === 0 ||
    runtime.effect.intensity.from !== runtime.effect.intensity.to ||
    Number.isFinite(runtime.effect.intensity.from) === false ||
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

/** Digest one record, refusing a value canonical JSON cannot encode. */
function recomputedDigest(
  runtime: IAutoMovieCompiledFilmEffect,
  value: object,
): string {
  try {
    return autoMovieRenderDigest(canonicalizeAutoMovieJson(value));
  } catch (error) {
    if (error instanceof AutoMovieCanonicalJsonError)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-runtime-invalid",
        `Film effect runtime "${runtime.effect.id}" holds a value canonical JSON cannot encode: ${error.message}`,
      );
    throw error;
  }
}
