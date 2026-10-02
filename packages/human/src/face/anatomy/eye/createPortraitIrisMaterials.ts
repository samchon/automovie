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
 * @evidence contracts/common.md#principled-implementation Linear interpolation between two endpoints inside [0,1] stays inside [0,1] at every band, so checking the two endpoints on each channel is enough to admit the whole palette; the bands are the eight sample points i/7 of that segment. Colours are linear-light reflectances, the space a physically based renderer multiplies light by, and no gamma is applied here.
 * @evidence contracts/common.md#clear-and-simple-design One function turns one pigment into eight materials from a prefix; the legacy shared iris and each independently coloured eye use the same palette, so the rule has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The palette is a function of the pigment and the prefix only, with no case named after a subject or fixture, and returns fresh values without mutating anything foreign.
 * @evidence contracts/common.md#meaningful-documentation The comment states the band law, why endpoints suffice, the identifier scheme, the fixed finish, what refuses and that the input is unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function emits materials and defines no geometric part; the iris geometry owns band membership.
 * @evidenceExclude contracts/modeling.md#parameter-channels The pigment's base and variation are declared by the pigment type; this function reads them and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it always emits eight materials.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The values are dimensionless linear-RGB reflectances and carry no length, angle or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part; the iris it colours is observed under the iris pigment rule and the eye builder.
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
