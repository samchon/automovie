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
 */
export function findHumanIntertragicNotch(
  head: IAutoMovieHumanHeadSkin,
  cavum: string,
): IAutoMovieVector3 {
  const p = head.positions;
  const vertices = humanHeadRegionVertices(head, [cavum]);
  let low = vertices[0];
  for (const v of vertices) if (p[v * 3 + 1] < p[low * 3 + 1]) low = v;
  return { x: p[low * 3], y: p[low * 3 + 1], z: p[low * 3 + 2] };
}
