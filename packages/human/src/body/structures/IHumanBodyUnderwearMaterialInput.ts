import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

/**
 * Final source skin part and its aligned rest-material coverage.
 *
 * @author Samchon
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
