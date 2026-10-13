import type { IAutoMovieMaterial } from "@automovie/interface";

import type { AutoMovieBuiltinTexturePurpose } from "./AutoMovieBuiltinTexturePurpose";

/**
 * Resolve implicit lookup consumers from the material/light declarations used.
 * A radius builds its table even at zero. Overlay normal fallback is needed
 * only without a base/detail normal map. Rectangular lighting requires its two
 * tables only when a physically based surface is reachable in the same scope.
 * This lists roles and computes neither pixels nor byte estimates.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes every supported implicit material and area-light lookup consumer without inventing source storage facts.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies required lookup roles for actual fact matching and explicit missing-resource refusal.
 */
export function requiredAutoMovieMaterialTexturePurposes(props: {
  materials: readonly IAutoMovieMaterial[];
  defaultPbr: boolean;
  areaLights: boolean;
}): AutoMovieBuiltinTexturePurpose[] {
  const purposes = new Set<AutoMovieBuiltinTexturePurpose>();
  for (const material of props.materials) {
    if (material.subsurfaceRadius !== undefined) purposes.add("subsurface-lut");
    if ((material.normalTexture === null || material.normalTexture === undefined) &&
        (material.detailNormalTexture === null || material.detailNormalTexture === undefined) &&
        material.overlays?.some((overlay) => overlay.normalTexture !== null && overlay.normalTexture !== undefined) === true)
      purposes.add("overlay-flat-normal");
  }
  if (props.areaLights && (props.defaultPbr || props.materials.length !== 0)) {
    purposes.add("area-ltc-1"); purposes.add("area-ltc-2");
  }
  return [...purposes];
}
