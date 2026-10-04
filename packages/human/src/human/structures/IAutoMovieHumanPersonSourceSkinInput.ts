import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * One evaluation of a final face skin: the face model after the face owner's
 * final contact result, and the performed body build it rides.
 *
 * @evidence contracts/common.md#principled-implementation The final face skin depends only on the evaluated face and the performed body.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both are the producers' own outputs; a pre-contact face is not accepted as final.
 * @evidence contracts/common.md#meaningful-documentation States both members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The producers own the parts; the carrier defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry; it names producers' geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The carrier adds no coordinate; each producer states its frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator, not this carrier, joins the skins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range Producer admission precedes this carrier.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer outputs, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkinInput {
  /** The evaluated face model, after its final contact result. */
  face: IAutoMovieModel;

  /** The performed body build. */
  body: IAutoMovieHumanBodyBuild;
}
