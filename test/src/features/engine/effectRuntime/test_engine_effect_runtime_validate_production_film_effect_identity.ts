import { AutoMovieFilmEffectRuntimeError, AutoMovieEngineEffect } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** A `sha256:` digest of 64 lowercase hex digits. */
const DIGEST: string = `sha256:${"a".repeat(64)}`;

/**
 * `validateProductionFilmEffectIdentity` accepts compile and edit fingerprints
 * that are SHA-256 digests and refuses any other length.
 *
 * Scenarios:
 *
 * 1. Two `sha256:` fingerprints of 64 hex digits are accepted.
 * 2. A 63-digit edit fingerprint is refused with the input-invalid code.
 */
export function test_engine_effect_runtime_validate_production_film_effect_identity(): void {
  AutoMovieEngineEffect.validateProductionFilmEffectIdentity({
    production: "production",
    film: "film",
    compileFingerprint: DIGEST,
    editFingerprint: DIGEST,
  });
  let code: string | null = null;
  try {
    AutoMovieEngineEffect.validateProductionFilmEffectIdentity({
      production: "production",
      film: "film",
      compileFingerprint: DIGEST,
      editFingerprint: `sha256:${"a".repeat(63)}`,
    });
  } catch (error) {
    code = error instanceof AutoMovieFilmEffectRuntimeError ? error.code : null;
  }
  TestValidator.equals("a short digest", code, "film-effect-input-invalid");
}
