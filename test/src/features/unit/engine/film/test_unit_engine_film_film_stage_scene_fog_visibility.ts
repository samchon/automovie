import { sceneFogTransmittance, stageScene } from "@automovie/engine";
import type {
  IAutoMovieStage,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../../../internal/filmFixtures";
import { hasViolation, nclose } from "../../../internal/predicates";

/**
 * Check the public staging path for fog authored by a transmission reference.
 *
 * Scenarios:
 *
 * 1. Half transmission at 40 metres gives one sixteenth at 80 metres because
 *    doubling axial depth quadruples the FogExp2 exponent.
 * 2. A reference transmission of one gives clear air at all camera depths.
 * 3. Nonpositive depths, zero or excess transmission, color disagreement and
 *    overflow are refused.
 * 4. Density and a transmission reference cannot both set the scene fog.
 */
export function test_unit_engine_film_film_stage_scene_fog_visibility(): void {
  const reference: NonNullable<IAutoMovieStage["fogVisibility"]> = {
    cameraDepthM: 40,
    transmittance: 0.5,
    color: { r: 0.7, g: 0.74, b: 0.8, a: null, hex: null },
  };
  const script: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const stage: IAutoMovieStage = makeStagingWrite();
  const staged: IAutoMovieStagedSet = stageScene(script, {
    ...stage,
    fogVisibility: reference,
  });
  if (
    !staged.success ||
    staged.scene.fog === null ||
    staged.scene.fog === undefined
  )
    throw new Error("The calibrated stage must retain fog");
  const color: typeof reference.color = staged.scene.fog.color;
  TestValidator.predicate(
    "the calibrated fog retains the authored color channels",
    nclose(color.r, 0.7) &&
      nclose(color.g, 0.74) &&
      nclose(color.b, 0.8) &&
      color.a === null &&
      color.hex === null,
  );
  TestValidator.predicate(
    "the canonical fog preserves the target and squared-depth falloff",
    nclose(staged.scene.fog.density, Math.sqrt(Math.LN2) / 40, 1e-12) &&
      nclose(sceneFogTransmittance(staged.scene.fog, 40), 0.5) &&
      nclose(sceneFogTransmittance(staged.scene.fog, 80), 1 / 16),
  );

  const clear: IAutoMovieStagedSet = stageScene(script, {
    ...stage,
    fogVisibility: { ...reference, transmittance: 1 },
  });
  TestValidator.predicate(
    "unit reference transmission lowers to zero density",
    clear.success &&
      Object.is(clear.scene.fog?.density, 0) &&
      sceneFogTransmittance(clear.scene.fog, 240) === 1,
  );

  const invalid: readonly [unknown, "range" | "type", string][] = [
    [
      { ...reference, cameraDepthM: 0 },
      "range",
      "$input.fogVisibility.cameraDepthM",
    ],
    [
      { ...reference, transmittance: 0 },
      "range",
      "$input.fogVisibility.transmittance",
    ],
    [
      { ...reference, transmittance: 1.01 },
      "range",
      "$input.fogVisibility.transmittance",
    ],
    [
      { ...reference, color: { ...reference.color, hex: "#ffffff" } },
      "type",
      "$input.fogVisibility.color.hex",
    ],
    [
      { ...reference, cameraDepthM: Number.MIN_VALUE },
      "range",
      "$input.fogVisibility",
    ],
  ];
  for (const [value, kind, path] of invalid) {
    const rejected: IAutoMovieStagedSet = stageScene(script, {
      ...stage,
      fogVisibility: value as IAutoMovieStage["fogVisibility"],
    });
    TestValidator.predicate(
      `malformed fog reference reports ${kind} at ${path}`,
      rejected.success === false && hasViolation(rejected, kind, path),
    );
  }

  const ambiguous: IAutoMovieStagedSet = stageScene(script, {
    ...stage,
    fog: { density: 0.1, color: reference.color },
    fogVisibility: reference,
  });
  TestValidator.predicate(
    "stage refuses both authored fog forms",
    ambiguous.success === false &&
      hasViolation(ambiguous, "type", "$input.fogVisibility"),
  );
}
