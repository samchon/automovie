import { sceneFogTransmittance, stageScene } from "@automovie/engine";
import type { IAutoMovieStagedSet, IAutoMovieStage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, nclose } from "../internal/predicates";

/**
 * Check the public staging path for fog authored by a transmission reference.
 *
 * Scenarios:
 *
 * 1. Half transmission at 40 metres gives one sixteenth at 80 metres because
 *    doubling axial depth quadruples the FogExp2 exponent.
 * 2. A reference transmission of one gives clear air at all camera depths.
 * 3. Nonpositive depths, non-finite values, zero or excess transmission,
 *    malformed references, color disagreement and overflow are refused.
 * 4. Density and a transmission reference cannot both set the scene fog.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Stages a calibrated scene and samples its canonical fog at two depths. Inspects the zero result, preserved color and exact authored paths for rejected input, catching a non-squared law, ignored reference or ambiguous declarations.
 * @evidence contracts/development/testing.md#independent-expectations The written FogExp2 law gives T(2d) = T(d)^4, so the expected fractions at 40 and 80 metres are the independently specified 1/2 and 1/16. The comparisons observe binary64 attenuation without asserting GPU pixels.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers representable references, the unit transmission boundary, malformed objects, invalid numeric and color fields, derived overflow and double authorship. Direct and omitted fog are covered by test_film_stage_scene_fog.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous discoverable entry owns all in-memory staging and transmittance queries, with no renderer, external program or artifact.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the public staging entry, camera-axis scaling rationale, clear-air boundary and submitted forms refused.
 */
export function test_film_stage_scene_fog_visibility(): void {
  const reference: NonNullable<IAutoMovieStage["fogVisibility"]> = {
    cameraDepthM: 40,
    transmittance: 0.5,
    color: { r: 0.7, g: 0.74, b: 0.8, a: null, hex: null },
  };
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    { ...makeStagingWrite(), fogVisibility: reference },
  );
  TestValidator.predicate(
    "the canonical fog preserves the target and squared-depth falloff",
    staged.success &&
      staged.scene.fog?.color === reference.color &&
      nclose(sceneFogTransmittance(staged.scene.fog, 40), 0.5) &&
      nclose(sceneFogTransmittance(staged.scene.fog, 80), 1 / 16),
  );

  const clear: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    {
      ...makeStagingWrite(),
      fogVisibility: { ...reference, transmittance: 1 },
    },
  );
  TestValidator.predicate(
    "unit reference transmission lowers to zero density",
    clear.success &&
      Object.is(clear.scene.fog?.density, 0) &&
      sceneFogTransmittance(clear.scene.fog, 240) === 1,
  );

  const invalid: readonly [unknown, "range" | "type", string][] = [
    [null, "type", "$input.fogVisibility"],
    [
      { ...reference, cameraDepthM: 0 },
      "range",
      "$input.fogVisibility.cameraDepthM",
    ],
    [
      { ...reference, cameraDepthM: Infinity },
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
      { ...reference, transmittance: NaN },
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
    const rejected: IAutoMovieStagedSet = stageScene(
      makeScriptWrite(),
      {
        ...makeStagingWrite(),
        fogVisibility: value as IAutoMovieStage["fogVisibility"],
      },
    );
    TestValidator.predicate(
      `malformed fog reference reports ${kind} at ${path}`,
      rejected.success === false && hasViolation(rejected, kind, path),
    );
  }

  const ambiguous: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    {
      ...makeStagingWrite(),
      fog: { density: 0.1, color: reference.color },
      fogVisibility: reference,
    },
  );
  TestValidator.predicate(
    "stage refuses both authored fog forms",
    ambiguous.success === false &&
      hasViolation(ambiguous, "type", "$input.fogVisibility"),
  );
}
