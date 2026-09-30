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
 *
 * @evidence contracts/common.md#principled-implementation The bake reads only positions, normals, UVs, indices and the opaque classification, which are fixed by the pose object's identity for one builder with fixed ray count and size, so pose identity is a complete invalidation key.
 * @evidence contracts/common.md#clear-and-simple-design One retained entry keyed by identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; a new pose object always rebakes.
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
  let last: { pose: object; images: ReadonlyMap<string, string> } | undefined;
  return (pose, model) => {
    if (last === undefined || last.pose !== pose)
      last = { pose, images: new Map(bake(model)) };
    return new Map(last.images);
  };
}
