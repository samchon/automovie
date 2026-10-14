import type {
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
} from "@automovie/interface";

import type { AutoMovieBuiltinTexturePurpose } from "./AutoMovieBuiltinTexturePurpose";

/**
 * Resolve implicit lookup consumers from the material/light declarations used.
 * A radius builds its table even at zero. Overlay normal fallback is needed
 * only without a base/detail normal map. Rectangular lighting requires its two
 * tables only when a physically based surface is reachable in the same scope.
 * This lists roles and computes neither pixels nor byte estimates.
 *
 * @evidence contracts/common.md#principled-implementation Inspect consumed material declarations for subsurface-radius and overlay normal-fallback lookup roles, and add both area-light tables only when a PBR surface is reachable in that scope.
 * @evidence contracts/common.md#clear-and-simple-design This owner determines required implicit roles without inventing texture extents; the host supplies actual runtime texture facts and closure matches the same role names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declared zero subsurface radius still builds its actual lookup, while existing base/detail normal maps avoid fallback; no fixture or budget result changes role requirements.
 * @evidence contracts/common.md#meaningful-documentation Docs explain zero-radius presence, overlay/base-normal interaction, PBR/area-light conditions and exclusion of byte estimates.
 * @evidence contracts/performance.md#efficient-algorithms M materials and their overlay lists require O(M+O) inspection, with a set bounded by four supported roles and fixed-size returned population.
 * @evidence contracts/performance.md#reuse-equivalent-work One role set deduplicates multiple consumers within the scope; changed materials/lights require fresh derivation and asset identity alone is not reused as proof.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only role strings escape; materials are borrowed and no lookup texture, native handle or asynchronous work is retained.
 */
export function requiredAutoMovieMaterialTexturePurposes(props: {
  materials: readonly IAutoMovieMaterial[];
  defaultPbr: boolean;
  areaLights: boolean;
}): AutoMovieBuiltinTexturePurpose[] {
  const purposes: Set<AutoMovieBuiltinTexturePurpose> =
    new Set<AutoMovieBuiltinTexturePurpose>();
  for (const material of props.materials) {
    if (material.subsurfaceRadius !== undefined) purposes.add("subsurface-lut");
    if (
      (material.normalTexture === null ||
        material.normalTexture === undefined) &&
      (material.detailNormalTexture === null ||
        material.detailNormalTexture === undefined) &&
      material.overlays?.some(
        (overlay: IAutoMovieMaterialOverlay): boolean =>
          overlay.normalTexture !== null && overlay.normalTexture !== undefined,
      ) === true
    )
      purposes.add("overlay-flat-normal");
  }
  if (props.areaLights && (props.defaultPbr || props.materials.length !== 0)) {
    purposes.add("area-ltc-1");
    purposes.add("area-ltc-2");
  }
  return [...purposes];
}
