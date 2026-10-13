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
 * @evidence contracts/common.md#principled-implementation Omitting completed model and anatomical quantities from a build exposes validated exterior-only geometry before internal solving.
 * @evidence contracts/common.md#clear-and-simple-design The exterior snapshot has a distinct skinModel field so it cannot masquerade as a completed anatomical model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Its prepared skinModel is not the later clothed build's retained sourceSkinModel.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes preparation, anatomical completion and pre-garment source retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The prepared skin evaluation record declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The prepared skin evaluation record declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The prepared skin evaluation record type has no runtime acquisition, retention or release operation.
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
