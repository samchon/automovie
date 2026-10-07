import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanSkinLandmark } from "../basis/humanSkinLandmark";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The rest position of a head view skin point named by a rule. A name the
 * head view does not declare, or a point on another surface than the skin
 * the rules read, refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Every head rule resolves its points through the head view's declared names.
 * @evidence contracts/common.md#clear-and-simple-design One lookup, one surface check, one position read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or misplaced point refuses; no nearest vertex stands in.
 * @evidence contracts/common.md#meaningful-documentation States the result and both refusals.
 * @evidence contracts/modeling.md#spatial-conventions Returns metres of the person frame at rest.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The consumer rule cites the point's definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function humanHeadPoint(
  head: IAutoMovieHumanHeadSkin,
  name: string,
): IAutoMovieVector3 {
  const point = humanSkinLandmark(head, name);
  if (point.surface !== head.surface)
    throw new Error(
      `The skin landmark ${name} of ${head.id} is not on the head view skin the rules read.`,
    );
  const v = point.vertex;
  return {
    x: head.positions[v * 3],
    y: head.positions[v * 3 + 1],
    z: head.positions[v * 3 + 2],
  };
}
