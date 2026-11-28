import { AutoMovieEngineResolve } from "@automovie/engine";
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
 * Light overrides replace selected point light fields and preserve the tested
 * identity and transform fields.
 *
 * Scenarios:
 *
 * 1. An intensity and range override replace those fields and keep the id, color
 *    and transform records.
 * 2. A position override changes the tested Y coordinate and keeps rotation
 *    and scale.
 * 3. A directional light receives the intensity override and retains its type
 *    and identifier when a range also appears in the override.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the observed point-light intensity, range and position overrides, retained transform fields, and directional-light identity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `applyLightOverride` with typed point and directional lights. It reads the replaced scalars, the Y coordinate of the replacement position, and retained color, transform, rotation, and scale references where asserted.
 * @evidence contracts/development/testing.md#independent-expectations The point light receives intensity 0.25 and range 9. A separate position override supplies Y 5 with the same rotation and scale, and a directional light named sun retains its type and ID with intensity 3.
 */
export function test_engine_resolve_apply_light_override(): void {
  const dimmed: IAutoMovieLight = AutoMovieEngineResolve.applyLightOverride(POINT, {
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
  const moved: IAutoMovieLight = AutoMovieEngineResolve.applyLightOverride(POINT, {
    position: { x: 4, y: 5, z: 6 },
  });
  TestValidator.predicate(
    "a position",
    moved.transform.translation.y === 5 &&
      moved.transform.rotation === POINT.transform.rotation &&
      moved.transform.scale === POINT.transform.scale,
  );
  const sun: IAutoMovieLight = AutoMovieEngineResolve.applyLightOverride(
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
