import { HUMAN_HAIR_SHADOW_DARKEST } from "./HUMAN_HAIR_SHADOW_DARKEST.js";

import { HUMAN_HAIR_SHADOW_ABSORPTION_SCALE } from "./HUMAN_HAIR_SHADOW_ABSORPTION_SCALE.js";

import { HUMAN_HAIR_SHADOW_OFFSETS } from "./HUMAN_HAIR_SHADOW_OFFSETS.js";

import { HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE } from "./HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE.js";

import { HUMAN_HAIR_SHADOW_LUMINANCE } from "./HUMAN_HAIR_SHADOW_LUMINANCE.js";

/**
 * The share of the light falling on a hair fibre that the fibre stops: one
 * minus the luminance of what passes straight through it.
 *
 * `albedo` is the linear colour the hair shows, which Chiang et al. map to
 * the fibre's absorption per unit radius, `(ln c / s(beta))^2`. A ray at
 * impact offset `h` crosses the fibre along `2 sqrt(1 - h^2)` radii and two
 * keratin surfaces, so what continues forward is `(1 - f)^2 exp(-2 sigma
 * sqrt(1 - h^2))` averaged over the offsets the fibre's width presents
 * uniformly (four-point Gauss-Legendre). Light hair absorbs little and passes
 * most of the light to the fibres behind it, which is why a white head is
 * bright throughout; dark hair stops most of it. Limits: light the fibre
 * scatters sideways (its reflection and internal reflections) is counted as
 * stopped, and the shadow is grey: the luminance of the per-channel
 * transmittance, since a depth shadow holds no colour.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under orbiting view and shadowed material display.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Applies device-bounded texture sampling and shadow policy without changing the saved anatomical document.
 */
export function hairFibreShadowOpacity(
  albedo: readonly [number, number, number],
): number {
  if (!albedo.every((value) => Number.isFinite(value) && value >= 0))
    throw new Error("A hair albedo is finite and nonnegative.");
  const passed = albedo.map((value) => {
    const sigma =
      (Math.log(Math.min(1, Math.max(HUMAN_HAIR_SHADOW_DARKEST, value))) / HUMAN_HAIR_SHADOW_ABSORPTION_SCALE) ** 2;
    return HUMAN_HAIR_SHADOW_OFFSETS.reduce(
      (sum, [h, weight]) =>
        sum + weight * Math.exp(-2 * sigma * Math.sqrt(1 - h * h)),
      0,
    );
  });
  return (
    1 -
    (1 - HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE) ** 2 *
      passed.reduce((sum, value, c) => sum + HUMAN_HAIR_SHADOW_LUMINANCE[c]! * value, 0)
  );
}
