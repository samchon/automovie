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
 * Refuse a persisted runtime whose shape is not the one the materializer writes.
 *
 * Version, owner, clock, half-open safe-integer interval, reduced frame rate,
 * inner effect id, zone and constant intensity in `[0, 1]`, both content
 * digests, and the exact frame clock of the inner stream (window and step)
 * must all match. A runtime holding a value canonical JSON cannot encode, such
 * as a non-finite number or a lone surrogate, is refused too. Every refusal is
 * `film-effect-runtime-invalid`. Identity currentness is a separate question
 * each consumer answers against the identity it independently established.
 *
 * Both digests are recomputed with the engine's canonical JSON and pure
 * SHA-256, which produce the same bytes and digest as the Node builder path,
 * so a browser and the builder accept or refuse the same persisted runtime.
 *
 * @evidence contracts/common.md#principled-implementation Integrity by recomputation: the digests are rebuilt from the canonical JSON of the record with its own digest member omitted, and the window and step are recomputed from the frames by `productionFrameBoundaryToSeconds` and `denominator / numerator`, the same float expressions the materializer evaluated, so exact equality is the right comparison.
 * @evidence contracts/common.md#clear-and-simple-design Answers only "is this a runtime the writer could have produced", leaving currentness to the sampler and the population verifier, which both call it first; cheap structural checks run before the digests so a malformed record fails without hashing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is repaired or defaulted, and only `AutoMovieCanonicalJsonError` is translated, because a value the canonicalizer refuses is by definition not a written runtime; any other exception still propagates.
 * @evidence contracts/common.md#meaningful-documentation States every property checked, that unencodable values are refused, the one refusal code, that currentness is out of scope, and that browser and builder agree on the digests.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the runtime's serialized size: two canonicalizations and two SHA-256 passes, the inner effect being serialized in both; the rest is constant work plus one logarithmic rate reduction.
 * @evidence contracts/performance.md#reuse-equivalent-work Not cached: callers hold mutable runtime records with no version token, so a previous verdict on the same object could be stale; the sampler and the verifier each validate once per entry per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the two canonical strings only during the call and retains nothing.
 */
export function validateProductionFilmEffectRuntime (
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
  const frameRate: IAutoMovieProductionFrameRate = productionFilmEffectFrameRate(
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
  const expectedEffectDigest: string = recomputedDigest(
    runtime,
    { ...runtime.effect, digest: undefined },
  );
  const expectedRuntimeDigest: string = recomputedDigest(
    runtime,
    { ...runtime, digest: undefined },
  );
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
function recomputedDigest (
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
