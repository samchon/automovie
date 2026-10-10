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
    if (
      point.x < 0 &&
      point.y >= subalare.right.y &&
      point.z > alarCurvature.right.z &&
      (right === undefined || point.x < right.x)
    )
      right = point;
    if (
      point.x > 0 &&
      point.y >= subalare.left.y &&
      point.z > alarCurvature.left.z &&
      (left === undefined || point.x > left.x)
    )
      left = point;
  }
  if (right === undefined || left === undefined)
    throw new Error(
      `The head view of ${head.id} has no alar skin in the alar band.`,
    );
  if (
    right.z - alarCurvature.right.z < 0.001 ||
    left.z - alarCurvature.left.z < 0.001
  )
    throw new Error(
      `missing rule: alare on ${head.id}; the skin keeps widening behind the alar curvature point, so its most lateral point in the alar band lies on the band's posterior bound`,
    );
  return { right, left };
}
