import { compareCodeUnits } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieModelPart as IAutoMovieModelPartImported,
} from "@automovie/interface";

import type { IHumanFaceOcclusionCacheEntry } from "./IHumanFaceOcclusionCacheEntry";
import { humanFaceOcclusionOpaqueMaterials } from "./humanFaceOcclusionOpaqueMaterials";

/**
 * Retain the expensive baked ambient-visibility images for one posed face.
 * The connected builder bakes before adding scalp hair. The pose identity
 * includes native and generated geometric profiles; actual composed materials
 * additionally decide which mesh materials are opaque. Brow and lash density
 * can change that membership, so it is compared separately through the same
 * alpha-mode classification owner the bake uses. Transmission and opacity
 * do not change that approximation. Colour, roughness and pigment do not
 * enter either key. Ray count and texture size are fixed by the builder.
 * Each returned map
 * has its own entries; a consumer cannot change the cached material binding.
 * The bakeHumanFaceOcclusion owner explains the sampling and its limits.
 *
 * @evidence contracts/common.md#principled-implementation Pose object identity and sorted actual opaque mesh-material ids determine reuse for the builder's fixed source/generation, bake options and pre-hair stage. The same classification is used by the baker; this key is insufficient for arbitrary external mesh mutation under an unchanged pose object.
 * @evidence contracts/common.md#clear-and-simple-design One latest image entry belongs to the AO stage, with material classification shared by a small owner and a supplied bake callback preserving the baker's geometric responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mask/blend classification changes invalidate images; matching colour/roughness changes alone do not trigger another geometric bake. A failed bake does not replace the prior entry, and cached approximate visibility does not certify physical scattering or GPU appearance.
 * @evidence contracts/common.md#meaningful-documentation Prose gives fixed ray/texture options, pre-scalp timing, geometry versus finish key dependencies, density-driven membership and returned-map independence.
 * @evidence contracts/performance.md#efficient-algorithms Each request scans M materials and P parts, deduplicates K used opaque ids and sorts them in O(K log K). A miss additionally pays the complete ray/UV/PNG bake; a hit copies K image-map entries without copying immutable string bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The pose cache's immutable result object identifies geometry, and the current opaque population identifies its material participation. Only the latest matching entry is shared; returned maps are copied so caller binding edits cannot mutate the retained map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One latest pose reference, population key and image map live until replacement or builder release. Image bytes follow configured texture dimensions and material count; caller-held URI strings may outlive the cache, and no GPU or asynchronous task is acquired.
 */
export function createHumanFaceOcclusionCache(
  bake: (model: IAutoMovieModel) => ReadonlyMap<string, string>,
): (pose: object, model: IAutoMovieModel) => Map<string, string> {
  let last: IHumanFaceOcclusionCacheEntry | undefined;
  return (pose: object, model: IAutoMovieModel): Map<string, string> => {
    const opaque: Set<string> = humanFaceOcclusionOpaqueMaterials(model);
    const opaqueMaterials: string = JSON.stringify(
      [
        ...new Set(
          model.parts.flatMap((part: IAutoMovieModelPartImported): string[] =>
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
