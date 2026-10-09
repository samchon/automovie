import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";

/**
 * Actual final parts and clothing coverage in their post-stitch vertex order.
 * The field's numbering follows the same retained vertices as every attribute.
 * @evidence contracts/common.md#principled-implementation Field order is the actual post-stitch survivor order used by mesh attributes.
 * @evidence contracts/common.md#clear-and-simple-design Carries final parts and their explicitly registered coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains actual stencil numbering instead of a coordinate fit.
 * @evidence contracts/common.md#meaningful-documentation Defines the post-stitch alignment.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries parts already named by composition.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Geometry was emitted by existing source operations.
 * @evidence contracts/modeling.md#spatial-conventions Parts retain Person-frame metres and fields retain rest coverage units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing operations define boundary samples.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final Person owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Final model admission retains its conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no input.
 * @author Samchon
 */
export interface IHumanPersonBodyRegionParts {
  /** Final Body parts in the Person's shared frame, with its Body namespace. */
  parts: IAutoMovieModel["parts"];

  /** Rest coverage and source ordinals in each final mesh's retained vertex order. */
  garmentFields: ReadonlyMap<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>;
}
