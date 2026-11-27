import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  validateLightPlacementShape
} from "../../../../../packages/engine/src/film/staging/internal/validateLightPlacementShape";
import type { IAutoMovieStageLight } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A staged light accepts geometry only for fields its kind can act on.
 *
 * Scenarios:
 *
 * 1. A directional light of intensity zero with a unit direction is valid.
 * 2. Negative intensity and a zero direction report at their source fields.
 * 3. A placed spot refuses a negative range and a zero cone angle.
 * 4. A shadow map belongs only to an active casting light and requires positive
 *    size and a strictly ordered clip interval.
 */
export function test_engine_film_validate_light_placement(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const key: IAutoMovieStageLight = {
    node: "fill",
    role: "fill",
    type: "directional",
    intensity: 0,
    direction: { x: 0, y: -1, z: 0 },
  };
  validateLightPlacementShape(key, "$input.lights[0]", out);
  validateLightPlacementShape(
    { ...key, intensity: -1, direction: { x: 0, y: 0, z: 0 } },
    "$input.lights[1]",
    out,
  );
  validateLightPlacementShape(
    {
      ...key,
      type: "spot",
      position: { x: 0, y: 3, z: 0 },
      range: -1,
      coneAngle: 0,
    },
    "$input.lights[2]",
    out,
  );
  validateLightPlacementShape(
    { ...key, castShadow: true },
    "$input.lights[3]",
    out,
  );
  validateLightPlacementShape(
    {
      ...key,
      castShadow: false,
      shadow: { mapSize: 0, bias: 0, normalBias: 0, near: 0, far: 0 },
    },
    "$input.lights[4]",
    out,
  );
  TestValidator.equals(
    "source fields identify invalid intensity, geometry and shadow settings",
    out.items.map(({ kind, path }) => [kind, path]),
    [
      ["range", "$input.lights[1].intensity"],
      ["range", "$input.lights[1].direction"],
      ["range", "$input.lights[2].range"],
      ["range", "$input.lights[2].coneAngle"],
      ["type", "$input.lights[3].shadow"],
      ["type", "$input.lights[4].shadow"],
      ["range", "$input.lights[4].shadow.mapSize"],
      ["range", "$input.lights[4].shadow.near"],
      ["range", "$input.lights[4].shadow.far"],
    ],
  );
}
