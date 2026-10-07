import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanConchaExtent } from "./IAutoMovieHumanConchaExtent";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadRegionVertices } from "./humanHeadRegionVertices";

/**
 * Read the conchal bowl's length and breadth, in metres: "Concha length -
 * Perpendicular distance between the superior-most and inferior-most points
 * on the concha, in a plane parallel to the straight line marking the
 * attachment of the auricle to the skin of the face" and "Concha breadth -
 * Perpendicular distance between the anterior-most and posterior-most points
 * on the concha, in a plane perpendicular to the straight line marking the
 * attachment of the auricle to the skin of the face" (Japatti et al., Ann
 * Maxillofac Surg 2018, PMC6018292). Their photoanthropometric study included
 * 505 Maharashtrian adults aged 18–64; its population values are not used as
 * this person's measurements. The concha is the named areas `concha` (Gray's Anatomy
 * 1918, p. 1034: the cavity "partially divided into two parts by the crus or
 * commencement of the helix; the upper part is termed the cymba conchae, the
 * lower part the cavum conchae"). The attachment line runs from otobasion
 * inferius to superius; length is the bowl's extent along it, breadth its
 * extent along the anterior direction made perpendicular to it (a stated
 * convention for which perpendicular). A missing or misplaced area refuses by
 * name. Degenerate attachment or anterior directions also refuse.
 *
 * The source owns the bowl's registration. An extent over a sparse or
 * frame-partitioned source region remains that region's sampled extent; it
 * does not establish that its boundary equals a clinical conchal boundary,
 * nor does either extent determine conchal depth or internal relief.
 *
 * @evidence contracts/common.md#principled-implementation Both extents are read on each skin over the declared conchal areas against registered attachment points.
 * @evidence contracts/common.md#clear-and-simple-design One frame and one pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing area refuses; the perpendicular is a documented convention.
 * @evidence contracts/common.md#meaningful-documentation States both protocol sentences, the conchal parts, the frame and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Metres along directions of the head frame; anterior is +Z.
 * @evidence contracts/anatomy.md#anatomical-source Follows the cited conchal protocol and Gray's division of the concha.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanConchaExtent(
  head: IAutoMovieHumanHeadSkin,
  concha: readonly string[],
  otobasionSuperius: IAutoMovieVector3,
  otobasionInferius: IAutoMovieVector3,
): IAutoMovieHumanConchaExtent {
  const line = [otobasionSuperius.x - otobasionInferius.x, otobasionSuperius.y - otobasionInferius.y, otobasionSuperius.z - otobasionInferius.z];
  const l = Math.hypot(...line);
  if (!Number.isFinite(l) || l === 0) throw new Error(`The auricle attachment line of ${head.id} has no finite direction.`);
  const u = line.map((c) => c / l);
  const w0 = [-u[2] * u[0], -u[2] * u[1], 1 - u[2] * u[2]];
  const m = Math.hypot(...w0);
  if (!Number.isFinite(m) || m === 0) throw new Error(`The auricle attachment line of ${head.id} has no perpendicular anterior direction.`);
  const w = w0.map((c) => c / m);
  const p = head.positions;
  let uLow = Infinity;
  let uHigh = -Infinity;
  let wLow = Infinity;
  let wHigh = -Infinity;
  for (const v of humanHeadRegionVertices(head, concha)) {
    const a = p[v * 3] * u[0] + p[v * 3 + 1] * u[1] + p[v * 3 + 2] * u[2];
    const b = p[v * 3] * w[0] + p[v * 3 + 1] * w[1] + p[v * 3 + 2] * w[2];
    uLow = Math.min(uLow, a);
    uHigh = Math.max(uHigh, a);
    wLow = Math.min(wLow, b);
    wHigh = Math.max(wHigh, b);
  }
  return { length: uHigh - uLow, breadth: wHigh - wLow };
}
