import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

/**
 * Final source skin part and its aligned rest-material coverage.
 *
 * @evidence contracts/common.md#principled-implementation The final performed part, rather than pre-join skin, supplies the geometry to material partition.
 * @evidence contracts/common.md#clear-and-simple-design One composition record names its part, coverage, correspondence and reserved fabric material.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are the actual part's values, without an additional fitted garment mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines final frame ownership and render-vertex alignment.
 * @author Samchon
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries an existing part; the composition owns fabric identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Part positions retain their metre frame and transform; field entries remain aligned.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The partition computes crossings.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers observe the material split.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Final source and mesh owners admit geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
 */
export interface IHumanBodyUnderwearMaterialInput {
  /** Final placed or stitched skin part, with its normal local frame. */
  part: IAutoMovieModel["parts"][number];

  /** Coverage aligned with final mesh render vertices. */
  field: readonly number[];

  /** Source or actual appended-stencil ordinals aligned with those vertices. */
  sources: readonly number[];

  /** Fabric material already registered in the final model. */
  material: IAutoMovieMaterial;
}
