import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadPair } from "./IAutoMovieHumanHeadPair";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * Find the alaria on a head view: "The most lateral point on each alar
 * contour" (Katina et al. 2016, J Anat, Table 2, alare), whose span is the
 * 3D Facial Norms nasal width "Right alare (al_r)-left alare (al_l)" (Weinberg
 * et al. 2016, PMC4841054).
 *
 * The ala is searched on each side over the head view's vertices between the
 * side's subalare and the pronasale heights and anterior to that side's alar
 * curvature point, the ala's facial insertion; that band is a stated
 * convention for where the alar contour lies. The most lateral vertex of each
 * side is the alare. A side with no vertex in the band refuses by name, and
 * so does a side whose most lateral vertex lies within 1 mm of the band's
 * posterior bound: there the skin keeps widening into the cheek and the bound
 * alone would set the reading (the margin is a stated convention).
 *
 * @evidence contracts/common.md#principled-implementation The alaria are lateral extremes found on each skin within a stated alar band.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty side and a bound-set extreme refuse; the band is a documented convention.
 * @evidence contracts/common.md#meaningful-documentation States both protocol sentences, the band, its status and both refusals.
 * @evidence contracts/modeling.md#spatial-conventions Right is -X; heights along +Y; anterior is +Z.
 * @evidence contracts/anatomy.md#anatomical-source Follows Katina 2016's alare and the 3DFN nasal width.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function findHumanAlaria(
  head: IAutoMovieHumanHeadSkin,
  subalare: IAutoMovieHumanHeadPair,
  alarCurvature: IAutoMovieHumanHeadPair,
  pronasale: IAutoMovieVector3,
): IAutoMovieHumanHeadPair {
  const p = head.positions;
  let right: IAutoMovieVector3 | undefined;
  let left: IAutoMovieVector3 | undefined;
  for (let v = 0; v < p.length / 3; v++) {
    const point = { x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] };
    if (point.y > pronasale.y) continue;
    if (point.x < 0 && point.y >= subalare.right.y && point.z > alarCurvature.right.z && (right === undefined || point.x < right.x)) right = point;
    if (point.x > 0 && point.y >= subalare.left.y && point.z > alarCurvature.left.z && (left === undefined || point.x > left.x)) left = point;
  }
  if (right === undefined || left === undefined) throw new Error(`The head view of ${head.id} has no alar skin in the alar band.`);
  if (right.z - alarCurvature.right.z < 0.001 || left.z - alarCurvature.left.z < 0.001)
    throw new Error(
      `missing rule: alare on ${head.id}; the skin keeps widening behind the alar curvature point, so its most lateral point in the alar band lies on the band's posterior bound`,
    );
  return { right, left };
}
