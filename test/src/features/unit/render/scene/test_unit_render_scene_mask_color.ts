import { maskColor } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the hue read back from a colour. */
const HUE_TOLERANCE: number = 1e-6;

/**
 * `maskColor` gives each mask index a fully saturated colour whose hue steps
 * 137.508 degrees, so neighbouring indices differ.
 *
 * Scenarios:
 *
 * 1. Index 0 is pure red.
 * 2. Index 1 has hue 137.508 / 360 at saturation 1 and lightness 0.5.
 * 3. The first twelve indices are all different colours.
 */
export function test_unit_render_scene_mask_color(): void {
  TestValidator.equals(
    "red",
    maskColor(0).toArray(),
    [1, 0, 0],
  );
  const hsl: THREE.HSL = { h: 0, s: 0, l: 0 };
  maskColor(1).getHSL(hsl, THREE.LinearSRGBColorSpace);
  TestValidator.predicate(
    "step",
    Math.abs(hsl.h - 137.508 / 360) < HUE_TOLERANCE &&
      Math.abs(hsl.s - 1) < HUE_TOLERANCE &&
      Math.abs(hsl.l - 0.5) < HUE_TOLERANCE,
  );
  TestValidator.equals(
    "distinct",
    new Set(
      Array.from({ length: 12 }, (_: unknown, index: number): string =>
        maskColor(index).getHexString(),
      ),
    ).size,
    12,
  );
}