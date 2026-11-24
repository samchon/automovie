import { productionFilmEffectFrameRate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `productionFilmEffectFrameRate` canonicalizes a frame rate to lowest terms.
 *
 * Scenarios:
 *
 * 1. A bare 24 is 24/1, and 60/4 reduces by their divisor 4 to 15/1.
 * 2. A zero numerator is refused with the code the caller names.
 */
export function test_unit_engine_effect_runtime_production_film_effect_frame_rate(): void {
  TestValidator.equals(
    "a bare rate",
    productionFilmEffectFrameRate(24, "film-effect-input-invalid"),
    { numerator: 24, denominator: 1 },
  );
  TestValidator.equals(
    "lowest terms",
    productionFilmEffectFrameRate(
      { numerator: 60, denominator: 4 },
      "film-effect-input-invalid",
    ),
    { numerator: 15, denominator: 1 },
  );
  let code: string | null = null;
  try {
    productionFilmEffectFrameRate(
      { numerator: 0, denominator: 1 },
      "film-effect-runtime-invalid",
    );
  } catch (error) {
    code =
      error instanceof Error && "code" in error ? String(error.code) : null;
  }
  TestValidator.equals("the caller's code", code, "film-effect-runtime-invalid");
}