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
    [...pigment.base, ...pigment.variation].some((v) => !Number.isFinite(v)) ||
    pigment.base.some(
      (v, i) =>
        v < 0 ||
        v > 1 ||
        v + pigment.variation[i] < 0 ||
        v + pigment.variation[i] > 1,
    )
  )
    throw new Error(
      "Iris pigmentation needs a material prefix and finite unit-range RGB endpoints.",
    );
  return Array.from({ length: 8 }, (_, i) => {
    const rgb = pigment.base.map(
      (value, axis) => value + pigment.variation[axis] * (i / 7),
    );
    const id = `${prefix}-${i}`;
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
