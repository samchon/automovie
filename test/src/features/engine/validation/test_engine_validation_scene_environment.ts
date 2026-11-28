import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieSceneEnvironment,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Environment admission collects independent background, exposure and intensity
 * failures for one authored record.
 *
 * Scenarios:
 *
 * 1. An image excludes a flat background. A mismatching flat swatch still
 *    identifies its hex field, independent of the image and both scalar
 *    faults.
 * 2. Zero intensity and positive exposure admit even a flat, unlit scene.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers independent background, swatch, exposure and intensity decisions and the valid zero-intensity boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateSceneEnvironment on literal lighting records carrying either a valid flat scene or conflicting fields together.
 * @evidence contracts/development/testing.md#independent-expectations An image and a flat background are mutually exclusive. White linear channels encode white independently of the conflicting swatch, and zero intensity remains valid with strictly positive exposure.
 */
export function test_engine_validation_scene_environment(): void {
  const base: IAutoMovieSceneEnvironment = {
    image: null,
    background: { r: 0, g: 0, b: 0, a: null, hex: "#000000" },
    intensity: 0,
    rotationDeg: -720,
    exposure: Number.MIN_VALUE,
    toneMapping: "none",
    shadows: { enabled: false, type: "vsm" },
  };
  TestValidator.equals(
    "valid lower boundaries are admitted",
    AutoMovieEngineValidation.validateSceneEnvironment({ environment: base }),
    { success: true },
  );
  const failed: IAutoMovieValidation = AutoMovieEngineValidation.validateSceneEnvironment({
    environment: {
      ...base,
      image: "studio.hdr",
      background: { r: 0, g: 0, b: 0, a: null, hex: "#ffffff" },
      intensity: -1,
      exposure: 0,
    },
  });
  if (failed.success)
    throw new Error("The contradictory environment must be refused");
  TestValidator.equals(
    "the authored fields receive independent failures",
    failed.violations.map(({ kind, path }) => [kind, path]),
    [
      ["type", "$input.background"],
      ["type", "$input.background.hex"],
      ["range", "$input.intensity"],
      ["range", "$input.exposure"],
    ],
  );
}
