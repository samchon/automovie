import { AutoMovieRenderSemanticMask } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the hue read back from a colour. */
const HUE_TOLERANCE: number = 1e-6;

/**
 * `AutoMovieRenderSemanticMask.colorForIndex` gives each mask index a fully saturated colour whose hue steps
 * 137.508 degrees, so neighbouring indices differ.
 *
 * Scenarios:
 *
 * 1. Index 0 is pure red.
 * 2. Index 1 has hue 137.508 / 360 at saturation 1 and lightness 0.5.
 * 3. The first twelve indices are all different colours.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe the first mask color, the precise hue step, and the uniqueness window.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that mask index zero is red, index one uses the stated saturated hue, and the first twelve indices remain distinguishable.
 * @evidence contracts/development/testing.md#independent-expectations Uses literal red and an independently constructed HSL color from 137.508 degrees at full saturation and half lightness.
 */
export function test_render_scene_mask_color(): void {
  TestValidator.equals(
    "red",
    AutoMovieRenderSemanticMask.colorForIndex(0).toArray(),
    [1, 0, 0],
  );
  const hsl: THREE.HSL = { h: 0, s: 0, l: 0 };
  AutoMovieRenderSemanticMask.colorForIndex(1).getHSL(hsl, THREE.LinearSRGBColorSpace);
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
        AutoMovieRenderSemanticMask.colorForIndex(index).getHexString(),
      ),
    ).size,
    12,
  );
}