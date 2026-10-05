import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPlanePoints } from "./humanHeadPlanePoints";

/**
 * Find pronasale on a head view: "the most anterior mid-point of the nasal
 * tip" (Katina et al. 2016, J Anat, Table 2, traditional definition), the
 * most anterior (+Z) point of the midsagittal section (the plane through
 * `sellion` normal to +X) strictly between the sellion and menton heights.
 * The rest orientation stands in for the head orientation the protocol
 * assumes (named approximation). A head with no section point in that span
 * refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation The tip is an extreme found on each skin; no vertex is fixed as pronasale.
 * @evidence contracts/common.md#clear-and-simple-design One section and one maximum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty span refuses.
 * @evidence contracts/common.md#meaningful-documentation States the definition, its source, the section, the span and the approximation.
 * @evidence contracts/modeling.md#spatial-conventions +Z anterior, +Y up in the head frame.
 * @evidence contracts/anatomy.md#anatomical-source Follows Katina et al. 2016 Table 2's traditional pronasale definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function findHumanPronasale(
  head: IAutoMovieHumanHeadSkin,
  sellion: IAutoMovieVector3,
  menton: IAutoMovieVector3,
): IAutoMovieVector3 {
  let best: IAutoMovieVector3 | undefined;
  for (const point of humanHeadPlanePoints(head, 0, sellion.x))
    if (point.y < sellion.y && point.y > menton.y && (best === undefined || point.z > best.z)) best = point;
  if (best === undefined) throw new Error(`The head view of ${head.id} has no midline nasal profile between sellion and menton.`);
  return best;
}
