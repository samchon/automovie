import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IPortraitHairShape } from "./IPortraitHairShape";
import { createPortraitHairNormalTexture } from "./createPortraitHairNormalTexture";
import { createPortraitHairTexture } from "./createPortraitHairTexture";

/**
 * Derive an owned, two-sided card finish from an admitted base material. Keep its authored mask cutoff, including zero; omission uses 0.45. The independent identity and resident mask leave untextured users of the base unchanged. The model owner validates base material fields and derived-id uniqueness.
 *
 * A greying proportion paints a mixture instead of one faded colour: the base finish becomes the unpigmented fibre, that proportion of the painted fibres keeps it and the rest take the authored colour as an encoded multiplier. Zero or omission leaves the finish and every texture byte as they were.
 *
 * @evidence contracts/common.md#principled-implementation A cloned resident finish gets an independent hair-card identity, mask cutoff and deterministic procedural textures.
 * @evidence contracts/common.md#clear-and-simple-design Grey mixture preserves authored pigment as encoded texture multipliers against an unpigmented base.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite normal/grey ranges refuse invalid values, and downstream model admission owns finish-id collision and base-material validity.
 * @evidence contracts/common.md#meaningful-documentation Zero cutoff is preserved, omitted cutoff uses 0.45, and omission or zero normal strength allocates no added normal map.
 * @evidence contracts/performance.md#efficient-algorithms Fixed finish work delegates dominant pixel/fibre cost to one or two texture rasterizations.
 * @evidence contracts/performance.md#reuse-equivalent-work Both maps share the same fibre parameters and raster owner, though their actual bytes are generated separately.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned material and textures are owned output; the base finish is cloned and no input material is mutated.
 */
export function createPortraitHairMaterial(
  finish: IAutoMovieMaterial,
  shape: Pick<
    IPortraitHairShape,
    | "seed"
    | "fibres"
    | "coverage"
    | "fibreNormalScale"
    | "fibreCurl"
    | "fibreShadeStrength"
  > & { grey?: number },
): IAutoMovieMaterial {
  const scale: number =
    shape.fibreNormalScale === undefined ? 0 : shape.fibreNormalScale;
  if (!Number.isFinite(scale) || scale < 0 || scale > 1)
    throw new Error("Hair fibre-normal strength must be finite in [0,1].");
  const grey: number = shape.grey ?? 0;
  if (!Number.isFinite(grey) || grey < 0 || grey > 1)
    throw new Error("A hair greying proportion must be finite in [0,1].");
  // An unpigmented fibre is brighter than a pigmented one, so a mixture puts
  // the unpigmented fibre in the base finish and paints the pigment as a
  // multiplier of it, in the same encoded space the shade already uses.
  const encode: (value: number) => number = (value: number): number =>
    value <= 0.0031308
      ? 12.92 * value
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  const mixture: { grey: number; pigment: number[]; } | undefined =
    grey === 0
      ? undefined
      : {
          grey,
          pigment: [finish.baseColor.r, finish.baseColor.g, finish.baseColor.b]
            .map((value: number): number => Math.min(1, Math.max(0, value)))
            .map(encode),
        };
  const id: string = finish.id + ":hair-cards";
  return {
    ...structuredClone(finish),
    ...(mixture === undefined
      ? {}
      : {
          baseColor: { r: 1, g: 1, b: 1, a: finish.baseColor.a, hex: null },
        }),
    id,
    name: id,
    doubleSided: true,
    alphaMode: "mask",
    alphaCutoff: finish.alphaCutoff ?? 0.45,
    baseColorTexture: createPortraitHairTexture(
      shape.seed,
      shape.fibres,
      shape.coverage,
      shape.fibreCurl,
      shape.fibreShadeStrength,
      mixture,
    ),
    ...(scale === 0
      ? {}
      : {
          normalTexture: createPortraitHairNormalTexture(
            shape.seed,
            shape.fibres,
            shape.coverage,
            shape.fibreCurl,
            mixture,
          ),
          normalScale: scale,
        }),
  };
}
