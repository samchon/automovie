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
 * @author Samchon
 */
export interface IHumanBodySkinEvaluation extends Omit<
  IAutoMovieHumanBodyBuild,
  "model" | "anatomicalQuantities" | "sourceSkinModel"
> {
  /** Validated exterior-only model, before internal anatomical parts are constructed. */
  skinModel: IAutoMovieModel;
}
