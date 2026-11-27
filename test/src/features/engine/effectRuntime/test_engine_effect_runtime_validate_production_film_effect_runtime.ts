import { AutoMovieEngineFilmEffectRuntimeError, AutoMovieEngineEffect } from "@automovie/engine";
import type { IAutoMovieCompiledFilmEffect } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectTimeline } from "../../internal/filmEffectTimeline";
import { materializedFilmEffects } from "../../internal/materializedFilmEffects";

/** The code a refused runtime carries, or null when it is admitted. */
const refusal: (runtime: IAutoMovieCompiledFilmEffect) => string | null = (
  runtime: IAutoMovieCompiledFilmEffect,
): string | null => {
  try {
    AutoMovieEngineEffect.validateProductionFilmEffectRuntime(runtime);
    return null;
  } catch (error) {
    return error instanceof AutoMovieEngineFilmEffectRuntimeError ? error.code : null;
  }
};

/**
 * `validateProductionFilmEffectRuntime` admits a materialized runtime and
 * refuses one whose interval or content digest was altered.
 *
 * Scenarios:
 *
 * 1. A materialized runtime is admitted.
 * 2. An interval that ends at its start is refused as invalid.
 * 3. A changed content digest is refused as invalid.
 */
export function test_engine_effect_runtime_validate_production_film_effect_runtime(): void {
  const runtime: IAutoMovieCompiledFilmEffect =
    materializedFilmEffects(filmEffectTimeline())[0]!;
  TestValidator.equals("admitted", refusal(runtime), null);
  TestValidator.equals(
    "an empty interval",
    refusal({ ...runtime, endFrame: runtime.startFrame }),
    "film-effect-runtime-invalid",
  );
  TestValidator.equals(
    "an altered digest",
    refusal({ ...runtime, digest: `sha256:${"0".repeat(64)}` }),
    "film-effect-runtime-invalid",
  );
}
