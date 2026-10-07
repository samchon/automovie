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
 *
 * @evidence contracts/common.md#principled-implementation Pose identity retains geometric input and sorted actually used opaque material IDs retain classification input; both must match before one builder reuses its bake.
 * @evidence contracts/common.md#clear-and-simple-design One retained entry keyed by pose identity and actual opaque population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A changed pose or opaque population rebakes without altering geometry, finish admission or ray settings.
 * @evidence contracts/common.md#meaningful-documentation States the key, what does not invalidate it, and that each returned map is a fresh copy.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createHumanFaceOcclusionCache is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels createHumanFaceOcclusionCache defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createHumanFaceOcclusionCache decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createHumanFaceOcclusionCache constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation createHumanFaceOcclusionCache owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/modeling.md#spatial-conventions createHumanFaceOcclusionCache keeps the caller's unit and frame and converts nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createHumanFaceOcclusionCache carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createHumanFaceOcclusionCache admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createHumanFaceOcclusionCache defines no input through which a caller shapes a human form.
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
