import { AutoMovieEngineFilmEffectRuntimeError, AutoMovieEngineEffect } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `productionFilmEffectFrameRate` canonicalizes a frame rate to lowest terms.
 *
 * Scenarios:
 *
 * 1. A bare 24 is 24/1, and 60/4 reduces by their divisor 4 to 15/1.
 * 2. A zero numerator is refused with the code the caller names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines conversion to lowest rational terms and preservation of the caller's refusal code.
 * @evidence contracts/development/testing.md#behavioral-verification Supplies a bare integer, a rational with common divisor and a zero numerator.
 * @evidence contracts/development/testing.md#independent-expectations An integer has denominator one, and dividing 60/4 by four gives 15/1. Zero must fail with the provided code.
 */
export function test_engine_effect_runtime_production_film_effect_frame_rate(): void {
  TestValidator.equals(
    "a bare rate",
    AutoMovieEngineEffect.productionFilmEffectFrameRate(24, "film-effect-input-invalid"),
    { numerator: 24, denominator: 1 },
  );
  TestValidator.equals(
    "lowest terms",
    AutoMovieEngineEffect.productionFilmEffectFrameRate(
      { numerator: 60, denominator: 4 },
      "film-effect-input-invalid",
    ),
    { numerator: 15, denominator: 1 },
  );
  let code: string | null = null;
  try {
    AutoMovieEngineEffect.productionFilmEffectFrameRate(
      { numerator: 0, denominator: 1 },
      "film-effect-runtime-invalid",
    );
  } catch (error) {
    code = error instanceof AutoMovieEngineFilmEffectRuntimeError ? error.code : null;
  }
  TestValidator.equals(
    "the caller's code",
    code,
    "film-effect-runtime-invalid",
  );
}
