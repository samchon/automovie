import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";

/**
 * Prepared skin, document and pose before internal source geometry is solved.
 *
 * The person consumer needs this exterior state to evaluate its head and form
 * one joined skin. No anatomical quantity has been solved and `skinModel`
 * contains the prepared skin and its existing exterior parts only; it is not
 * a completed anatomical body model or a replacement for the normal builder.
 * The completed clothed build's optional sourceSkinModel is a different stage:
 * its source regions are retained after assembly and placement, before the
 * final garment material split. Preparation carries only its own skinModel.
 *
 * @evidence contracts/common.md#principled-implementation Skin and pose precede the complete person exterior, which precedes the internal source target solve.
 * @evidence contracts/common.md#clear-and-simple-design The existing body evaluation fields are retained while the unfinished anatomical model and quantities are excluded.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A skin preparation is named as such and cannot stand as a completed anatomical body build.
 * @evidence contracts/common.md#meaningful-documentation States the stage boundary, consumer and absent internal solve.
 * @evidence contracts/modeling.md#spatial-conventions Existing skin and bone evaluation fields retain common body metres.
 * @evidence contracts/modeling.md#shared-boundaries A composition owner can reuse this exact prepared skin and pose to form its complete exterior before completing the internal source solve.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing exterior parts retain their owners.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing body owners admit and solve exterior controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The body surface owner emits the exterior.
 * @evidenceExclude contracts/modeling.md#rendered-observation The completed body and person consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This stage record adds no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing skin and pose owners admit their inputs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record adds no personal control.
 *
 * @author Samchon
 */
export interface IHumanBodySkinEvaluation extends Omit<
  IAutoMovieHumanBodyBuild,
  "model" | "anatomicalQuantities" | "sourceSkinModel"
> {
  /** Validated exterior-only model, before internal anatomical parts are constructed. */
  skinModel: IAutoMovieModel;
}
