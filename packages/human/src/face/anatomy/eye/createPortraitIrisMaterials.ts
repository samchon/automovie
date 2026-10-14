import type { IAutoMovieMaterial } from "@automovie/interface";

import { IPortraitIrisPigment } from "./structures/IPortraitIrisPigment";

/**
 * Own eight pigment finishes under a caller's material prefix. The same linear
 * palette supplies the legacy shared iris and an independently colored eye.
 * Every returned color is a fresh value; no mutable input array is retained.
 *
 * Band i uses base + (i/7)*variation. Because every intermediate value is a
 * convex combination of the admitted endpoints, checking those endpoints is
 * sufficient for the entire palette. The iris geometry owns band membership;
 * this material owner cannot alter the limbus, pupil, gaze or corneal surface.
 *
 * The prefix must be nonblank and already trimmed, so `prefix-0` to `prefix-7`
 * are distinct, stable identifiers. Each material is an opaque, non-metallic,
 * double-sided finish with roughness 0.65 and a linear-RGB base colour; the
 * roughness is a fixed authored value and not a per-eye measurement. A prefix
 * that is blank or padded, a triple that is not three finite numbers, and an
 * endpoint (base, or base plus variation) outside [0,1] on any channel all
 * throw, and the input pigment is left unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Eight linear-RGB bands use convex interpolation of admitted base and base-plus-variation endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One pigment palette owner is shared by portrait and connected/generated optical consumers; geometry owns band membership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roughness and opaque double-sided finishes are authored conventions, not acquired optical properties.
 * @evidence contracts/common.md#meaningful-documentation The prose states linear colour, stable trimmed prefix, endpoint admission and fresh colour ownership.
 * @evidence contracts/performance.md#efficient-algorithms Prefix admission and eight generated IDs scale with prefix length. Valid pigments then require fixed eight-band/three-channel interpolation and allocation; malformed channel arrays are rejected by length before scanning their values.
 * @evidence contracts/performance.md#reuse-equivalent-work Both eye families reuse the same interpolation and admission law while each result owns mutable colours.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only eight owned material records escape; no pigment array, texture, cache or resource is retained.
 */
export function createPortraitIrisMaterials(
  prefix: string,
  pigment: IPortraitIrisPigment,
): IAutoMovieMaterial[] {
  if (
    prefix.trim().length === 0 ||
    prefix !== prefix.trim() ||
    pigment.base.length !== 3 ||
    pigment.variation.length !== 3 ||
    [...pigment.base, ...pigment.variation].some((v: number): boolean  => !Number.isFinite(v)) ||
    pigment.base.some(
      (v: number, i: number): boolean  =>
        v < 0 ||
        v > 1 ||
        v + pigment.variation[i] < 0 ||
        v + pigment.variation[i] > 1,
    )
  )
    throw new Error(
      "Iris pigmentation needs a material prefix and finite unit-range RGB endpoints.",
    );
  return Array.from({ length: 8 }, (_: unknown, i: number): { id: string; name: string; baseColor: { r: number; g: number; b: number; a: number; hex: null; }; roughness: number; metallic: number; opacity: number; emissive: null; baseColorTexture: null; doubleSided: true; }  => {
    const rgb: number[] = pigment.base.map(
      (value: number, axis: number): number  => value + pigment.variation[axis] * (i / 7),
    );
    const id: string = `${prefix}-${i}`;
    return {
      id,
      name: id,
      baseColor: { r: rgb[0], g: rgb[1], b: rgb[2], a: 1, hex: null },
      roughness: 0.65,
      metallic: 0,
      opacity: 1,
      emissive: null,
      baseColorTexture: null,
      doubleSided: true,
    };
  });
}
