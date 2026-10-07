import type { IAutoMovieModel } from "@automovie/interface";

/** Actual material classification shared by the AO bake and its cache.
 * Masked and blended finishes do not occlude this opaque-surface estimate.
 *
 * @evidence contracts/common.md#principled-implementation Selects the same non-mask/non-blend material IDs for baker mesh population and cache invalidation.
 * @evidence contracts/common.md#clear-and-simple-design One classification owner prevents bake and reuse decisions from disagreeing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads actual composed alpha modes without source-specific material exceptions.
 * @evidence contracts/common.md#meaningful-documentation Names omitted finish classes; the returned set is owned and model materials remain unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports computational inputs and defines no form-varying channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no joined surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the assembled consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Establishes no anatomical quantity or physiological source.
 * @evidenceExclude contracts/anatomy.md#permitted-range Owns no physiological range; anatomical admission remains with its input owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no public measurement or physiological control for shaping a person.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity or conversion.
 * @author Samchon
 */
export function humanFaceOcclusionOpaqueMaterials(model: IAutoMovieModel): Set<string> {
  return new Set(model.materials.filter((material) =>
    material.alphaMode !== "mask" && material.alphaMode !== "blend",
  ).map((material) => material.id));
}
