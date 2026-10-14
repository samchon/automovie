import type { IPortraitHairShape } from "./IPortraitHairShape";
import { createPortraitHairFibreTexture } from "./createPortraitHairFibreTexture";

/**
 * Generate a resident PNG mask for a bundle of painted fibres. The 128 by 256 RGBA image contains longitudinal colour variation, root fade and staggered tapered tips. A seed controls only deterministic arithmetic, never randomness. An optional complete curl profile uses a 512-square pattern with independent seeded waves; omission retains the original raster and bytes. The returned data URI is self-contained and needs no photograph or network. Coverage is an authoring ratio, not a measured biological hair density. Shade strength in [0,1] interpolates encoded RGB towards white independently of alpha. Omission or one preserves the original raster bytes; zero leaves all pigmentation to the authored base finish, including for pale hair. An optional fibre mixture paints a greying head: the base finish is then the unpigmented fibre and the given proportion of painted fibres keeps it, while the rest take the pigment. Omission leaves the original bytes.
 *
 * @evidence contracts/common.md#principled-implementation The shared deterministic raster produces longitudinal shade, root fade and tapered alpha coverage.
 * @evidence contracts/common.md#clear-and-simple-design This wrapper chooses RGBA colour output with optional complete curl and mixture fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage is an authoring ratio rather than biological density, and no photo/network data is used.
 * @evidence contracts/common.md#meaningful-documentation Shade strength affects encoded RGB independently of alpha; default one preserves the legacy formula.
 * @evidence contracts/performance.md#efficient-algorithms Work follows the shared raster resolution times fibre population plus PNG compression.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical fibre owner supplies colour and matching normal semantics instead of copied painting formulas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned PNG data URI owns resident encoded bytes; this wrapper retains no mesh, bitmap or cache.
 */
export function createPortraitHairTexture(
  seed: number,
  fibres: number,
  coverage: number,
  curl?: IPortraitHairShape["fibreCurl"],
  shadeStrength: number = 1,
  mixture?: { pigment: readonly number[]; grey: number },
): string {
  return createPortraitHairFibreTexture(
    seed,
    fibres,
    coverage,
    false,
    curl,
    shadeStrength,
    mixture,
  );
}
