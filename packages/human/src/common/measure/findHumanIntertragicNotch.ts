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
 * @evidence contracts/common.md#principled-implementation The lowest Y vertex of the named cavum-conchae region is the declared notch convention; humanHeadRegionVertices validates nonempty resident membership and source surface, while clinical notch identity remains registration-dependent.
 * @evidence contracts/common.md#clear-and-simple-design The shared region reader owns admission and this instrument owns only the inferior extreme.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population notch height or fixture index chooses the point; the lowest registered sample is a stated anatomical approximation.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the intertragic role, named cavum convention and refusal of missing/misplaced areas.
 * @evidence contracts/performance.md#efficient-algorithms For R registered region vertices, validated membership and one minimum scan use O(R) work and the gathered list uses O(R) space.
 * @evidence contracts/performance.md#reuse-equivalent-work Region admission is reused rather than duplicated; the validated vertex list supplies the complete minimum scan without cross-head memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The gathered list is temporary and one coordinate record transfers to the caller; borrowed position arrays and all temporary membership acquire no handles or tasks.
 */
export function findHumanIntertragicNotch(
  head: IAutoMovieHumanHeadSkin,
  cavum: string,
): IAutoMovieVector3 {
  const p: number[] = head.positions;
  const vertices: number[] = humanHeadRegionVertices(head, [cavum]);
  let low: number = vertices[0];
  for (const v of vertices) if (p[v * 3 + 1] < p[low * 3 + 1]) low = v;
  return { x: p[low * 3], y: p[low * 3 + 1], z: p[low * 3 + 2] };
}
