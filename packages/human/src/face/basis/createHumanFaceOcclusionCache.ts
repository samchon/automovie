import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Retain the expensive baked ambient-visibility images for one posed face.
 * The connected builder bakes before adding scalp hair; its source materials
 * own the opaque/masked classification and document overrides can change only
 * colour, roughness, fibre pigment and coverage. The bake reads positions,
 * normals, UVs, indices and that fixed classification, never those appearance
 * values, so the admitted pose object's identity is the complete invalidation
 * key for one builder with fixed ray count and texture size. Each returned map
 * has its own entries; a consumer cannot change the cached material binding.
 * The bakeHumanFaceOcclusion owner explains the sampling and its limits.
 */
export function createHumanFaceOcclusionCache(
  bake: (model: IAutoMovieModel) => ReadonlyMap<string, string>,
): (pose: object, model: IAutoMovieModel) => Map<string, string> {
  let last: { pose: object; images: ReadonlyMap<string, string> } | undefined;
  return (pose, model) => {
    if (last === undefined || last.pose !== pose)
      last = { pose, images: new Map(bake(model)) };
    return new Map(last.images);
  };
}
