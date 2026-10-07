import type { IAutoMovieHumanHeadPair } from "./IAutoMovieHumanHeadPair";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * The head view's `tragion-right` and `tragion-left` skin points as a pair;
 * a missing name refuses by name (`humanHeadPoint`).
 *
 * @evidence contracts/common.md#principled-implementation Bilateral rules read both tragia through the head view's declared names.
 * @evidence contracts/common.md#clear-and-simple-design Two lookups.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing name refuses.
 * @evidence contracts/common.md#meaningful-documentation States the names and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Points in metres of the head frame.
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
export function humanHeadTragia(
  head: IAutoMovieHumanHeadSkin,
): IAutoMovieHumanHeadPair {
  return {
    right: humanHeadPoint(head, "tragion-right"),
    left: humanHeadPoint(head, "tragion-left"),
  };
}
