import type { IPortraitHairShape } from "./IPortraitHairShape";
import { createTexture } from "./createTexture";

/**
 * Generate a resident PNG mask for a bundle of painted fibres. The 128 by 256
 * RGBA image contains longitudinal colour variation, root fade and staggered
 * tapered tips. A seed controls only deterministic arithmetic, never randomness.
 * An optional complete curl profile uses a 512-square pattern with independent
 * seeded waves; omission retains the original raster and bytes. The returned
 * data URI is self-contained and needs no photograph or network.
 * Coverage is an authoring ratio, not a measured biological hair density.
 * Shade strength in [0,1] interpolates encoded RGB towards white independently
 * of alpha. Omission or one preserves the original raster bytes; zero leaves
 * all pigmentation to the authored base finish, including for pale hair.
 * An optional fibre mixture paints a greying head: the base finish is then the
 * unpigmented fibre and the given proportion of painted fibres keeps it, while
 * the rest take the pigment. Omission leaves the original bytes.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies repeatable fibre coverage for surface hair rather than a mesh for every fibre.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Encodes root-to-tip variation and an alpha silhouette in a resident normalized-UV PNG.
 */
export function createPortraitHairTexture(
  seed: number,
  fibres: number,
  coverage: number,
  curl?: IPortraitHairShape["fibreCurl"],
  shadeStrength = 1,
  mixture?: { pigment: readonly number[]; grey: number },
): string {
  return createTexture(
    seed,
    fibres,
    coverage,
    false,
    curl,
    shadeStrength,
    mixture,
  );
}
