import { applyLightOverride } from "@automovie/engine";
import type { IAutoMovieLight } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A point light with every other field at rest. */
const POINT: IAutoMovieLight = {
  id: "lamp",
  type: "point",
  transform: {
    translation: { x: 0, y: 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 1,
  range: 5,
};

/**
 * `applyLightOverride` returns the light with the animated fields replaced and
 * every other field carried.
 *
 * Scenarios:
 *
 * 1. An intensity and range override replace those fields and keep the id, color
 *    and transform records.
 * 2. A position override replaces the translation and keeps rotation and scale.
 * 3. A directional light takes the intensity override and stays directional; it\n
 *
 *    - Has no range to override.
 */
export function test_unit_engine_resolve_apply_light_override(): void {
  const dimmed: IAutoMovieLight = applyLightOverride(POINT, {
    intensity: 0.25,
    range: 9,
  });
  TestValidator.predicate(
    "replaced and carried",
    dimmed.type === "point" &&
      dimmed.range === 9 &&
      dimmed.intensity === 0.25 &&
      dimmed.id === "lamp" &&
      dimmed.color === POINT.color &&
      dimmed.transform === POINT.transform,
  );
  const moved: IAutoMovieLight = applyLightOverride(POINT, {
    position: { x: 4, y: 5, z: 6 },
  });
  TestValidator.predicate(
    "a position",
    moved.transform.translation.y === 5 &&
      moved.transform.rotation === POINT.transform.rotation &&
      moved.transform.scale === POINT.transform.scale,
  );
  const sun: IAutoMovieLight = applyLightOverride(
    {
      id: "sun",
      type: "directional",
      transform: POINT.transform,
      color: POINT.color,
      intensity: 1,
    },
    { range: 9, intensity: 3 },
  );
  TestValidator.predicate(
    "a directional light takes the intensity and stays directional",
    sun.type === "directional" && sun.intensity === 3 && sun.id === "sun",
  );
}
