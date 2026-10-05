import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadEar } from "./humanHeadEar";

/**
 * The head view triangles of both named ear areas (`ear-right`, `ear-left`),
 * the set a face-skin search leaves out; a missing area refuses by name
 * (`humanHeadEar`).
 *
 * @evidence contracts/common.md#principled-implementation Searches over the face skin leave out the declared ears, not a height.
 * @evidence contracts/common.md#clear-and-simple-design Two area reads and one union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing area refuses.
 * @evidence contracts/common.md#meaningful-documentation States the areas and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Triangle ordinals of the head view.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 * @author Samchon
 */
export function humanHeadEars(head: IAutoMovieHumanHeadSkin): Set<number> {
  return new Set([...humanHeadEar(head, "ear-right").triangles, ...humanHeadEar(head, "ear-left").triangles]);
}
