import { AutoMovieFilmEffectRuntimeError } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieFilmEffectRuntimeError` carries a refusal code beside its message.
 *
 * Scenarios:
 *
 * 1. The code, message and name are the ones given.
 */
export function test_unit_engine_effect_runtime_film_effect_runtime_error(): void {
  const error: AutoMovieFilmEffectRuntimeError =
    new AutoMovieFilmEffectRuntimeError("film-effect-input-invalid", "bad cue");
  TestValidator.predicate(
    "code, message, name",
    error instanceof Error &&
      error.code === "film-effect-input-invalid" &&
      error.message === "bad cue" &&
      error.name === "AutoMovieFilmEffectRuntimeError",
  );
}
