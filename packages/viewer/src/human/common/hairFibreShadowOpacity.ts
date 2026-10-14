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
 * uniformly (four-point Gauss-Legendre). This viewer shadow approximation
 * borrows the color-to-absorption fit in Chiang et al., section 4.2, equation 9:
 * https://media.disneyanimation.com/uploads/production/publication_asset/152/asset/eurographics2016Fur_Smaller.pdf.
 * The paper fits rendered dense hair cubes, not anatomical measurements of a
 * particular person's fibres. Limits: light the fibre
 * scatters sideways (its reflection and internal reflections) is counted as
 * stopped, and the shadow is grey: the luminance of the per-channel
 * transmittance, since a depth shadow holds no colour.
 *
 * @evidence contracts/common.md#principled-implementation Admits finite nonnegative RGB, clamps each channel to the configured logarithm floor and one, squares log color divided by the fitted absorption scale, and integrates forward exponential transmission over four impact offsets before a grey luminance projection. Normal-incidence surface reflection, fixed roughness and straight cylinder chords are disclosed modeling assumptions, not a complete angular scattering model.
 * @evidence contracts/common.md#clear-and-simple-design One numerical opacity evaluator mirrors the shader's named constants and quadrature. Native depth-grid thresholding stays in createHairCardShadowMaterial, separate from the transmission estimate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The logarithm floor avoids undefined zero absorption conversion and values above one clamp to the supported albedo range; neither is a fixture correction. Applying a rendered-volume color fit to this card-shadow approximation is an inference with monochrome and sideways-scatter limitations, not clinical measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment links the read primary fit and states its simulated provenance, radius-normalized absorption, chord integration and monochrome limitation; it does not claim photographed hair or exact rendered parity.
 * @evidence contracts/performance.md#efficient-algorithms Three channels times four quadrature samples require fixed work and a three-number temporary array. Log/exp operations dominate scalar cost; no fibre population or image scan occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work CPU and generated GLSL share constant owners, while decimal formatting and shader arithmetic can round differently; equivalent formulas are not a bitwise output identity claim.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one opacity scalar and retains no albedo, material or texture. Fixed module constants remain for module lifetime; the native shadow material has its own caller-owned disposer.
 */
export function hairFibreShadowOpacity(
  albedo: readonly [number, number, number],
): number {
  if (!albedo.every((value: number): boolean => Number.isFinite(value) && value >= 0))
    throw new Error("A hair albedo is finite and nonnegative.");
  const passed: number[] = albedo.map((value: number): number => {
    const sigma: number =
      (Math.log(Math.min(1, Math.max(HUMAN_HAIR_SHADOW_DARKEST, value))) / HUMAN_HAIR_SHADOW_ABSORPTION_SCALE) ** 2;
    return HUMAN_HAIR_SHADOW_OFFSETS.reduce(
      (sum: number, [h, weight]: readonly [number, number]): number =>
        sum + weight * Math.exp(-2 * sigma * Math.sqrt(1 - h * h)),
      0,
    );
  });
  return (
    1 -
    (1 - HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE) ** 2 *
      passed.reduce((sum: number, value: number, c: number): number => sum + HUMAN_HAIR_SHADOW_LUMINANCE[c]! * value, 0)
  );
}
