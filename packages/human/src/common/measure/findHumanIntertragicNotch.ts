import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadRegionVertices } from "./humanHeadRegionVertices";

/**
 * Find the intertragic notch on a head view: the notch that separates the
 * tragus from "a small tubercle, the antitragus" (Gray's Anatomy 1918,
 * p. 1034), point h of Cho et al.'s Korean auricle study (J Korean Med Sci
 * 2025, PMC12148551, Fig. 1; 631 adults aged 20–92 in facial 3D-CT).
 * The notch is the cavum conchae's inferior opening
 * between those two eminences, so the point is the lowest vertex of the named
 * cavum conchae area, a stated convention for where on the notch the point
 * lies. A missing or misplaced area refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation The notch is an extreme found on each skin within the declared cavum area.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the area's vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing area refuses; the lowest-point choice is a documented convention.
 * @evidence contracts/common.md#meaningful-documentation States both sources, the convention and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Heights along +Y of the head frame, metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows Gray's description and the cited study's point h.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function findHumanIntertragicNotch(head: IAutoMovieHumanHeadSkin, cavum: string): IAutoMovieVector3 {
  const p = head.positions;
  const vertices = humanHeadRegionVertices(head, [cavum]);
  let low = vertices[0];
  for (const v of vertices) if (p[v * 3 + 1] < p[low * 3 + 1]) low = v;
  return { x: p[low * 3], y: p[low * 3 + 1], z: p[low * 3 + 2] };
}
