import { compareCodeUnits } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceOcclusionCacheEntry } from "./IHumanFaceOcclusionCacheEntry";
import { humanFaceOcclusionOpaqueMaterials } from "./humanFaceOcclusionOpaqueMaterials";

/**
 * Retain the expensive baked ambient-visibility images for one posed face.
 * The connected builder bakes before adding scalp hair. The pose identity
 * includes native and generated geometric profiles; actual composed materials
 * additionally decide which mesh materials are opaque. Brow and lash density
 * can change that membership, so it is compared separately through the same
 * classification owner the bake uses. Colour, roughness and pigment do not
 * enter either key. Ray count and texture size are fixed by the builder.
 * Each returned map
 * has its own entries; a consumer cannot change the cached material binding.
 * The bakeHumanFaceOcclusion owner explains the sampling and its limits.
 */
export function createHumanFaceOcclusionCache(
  bake: (model: IAutoMovieModel) => ReadonlyMap<string, string>,
): (pose: object, model: IAutoMovieModel) => Map<string, string> {
  let last: IHumanFaceOcclusionCacheEntry | undefined;
  return (pose, model) => {
    const opaque = humanFaceOcclusionOpaqueMaterials(model);
    const opaqueMaterials = JSON.stringify(
      [
        ...new Set(
          model.parts.flatMap((part) =>
            part.geometry.type === "mesh" &&
            part.material !== null &&
            opaque.has(part.material)
              ? [part.material]
              : [],
          ),
        ),
      ].sort(compareCodeUnits),
    );
    if (
      last === undefined ||
      last.pose !== pose ||
      last.opaqueMaterials !== opaqueMaterials
    )
      last = { pose, opaqueMaterials, images: new Map(bake(model)) };
    return new Map(last.images);
  };
}
