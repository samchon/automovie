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
 * @evidence contracts/common.md#principled-implementation Normalize the registered auricle attachment line and its perpendicular anterior projection, then report the concha sample extents along both axes. Missing/nonresident regions and degenerate directions refuse; sparse registration does not establish a clinical bowl boundary or depth.
 * @evidence contracts/common.md#clear-and-simple-design The shared region reader owns membership admission while this instrument owns attachment-relative projection and two scalar extents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The perpendicular choice is a declared source convention, with no study-average dimensions, expected bowl shape or fixture vertices substituted.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre units, attachment/perpendicular semantics, direction refusals and the distinction between sampled extent and clinical conchal detail.
 * @evidence contracts/performance.md#efficient-algorithms For R concha memberships, validation and two projections cost O(R) time and O(R) gathered indices; frame vectors/candidate bounds use constant additional space.
 * @evidence contracts/performance.md#reuse-equivalent-work Attachment and transverse unit directions are computed once for all samples, and canonical region admission is reused instead of a second lookup policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Gathered vertices and fixed-size frame arrays remain local, and two scalar extents transfer to the caller without retaining skin arrays, handles or tasks.
 */
export function readHumanConchaExtent(
  head: IAutoMovieHumanHeadSkin,
  concha: readonly string[],
  otobasionSuperius: IAutoMovieVector3,
  otobasionInferius: IAutoMovieVector3,
): IAutoMovieHumanConchaExtent {
  const line: number[] = [
    otobasionSuperius.x - otobasionInferius.x,
    otobasionSuperius.y - otobasionInferius.y,
    otobasionSuperius.z - otobasionInferius.z,
  ];
  const l: number = Math.hypot(...line);
  if (!Number.isFinite(l) || l === 0)
    throw new Error(
      `The auricle attachment line of ${head.id} has no finite direction.`,
    );
  const u: number[] = line.map((c: number): number => c / l);
  const w0: number[] = [-u[2] * u[0], -u[2] * u[1], 1 - u[2] * u[2]];
  const m: number = Math.hypot(...w0);
  if (!Number.isFinite(m) || m === 0)
    throw new Error(
      `The auricle attachment line of ${head.id} has no perpendicular anterior direction.`,
    );
  const w: number[] = w0.map((c: number): number => c / m);
  const p: number[] = head.positions;
  let uLow: number = Infinity;
  let uHigh: number = -Infinity;
  let wLow: number = Infinity;
  let wHigh: number = -Infinity;
  for (const v of humanHeadRegionVertices(head, concha)) {
    const a: number = p[v * 3] * u[0] + p[v * 3 + 1] * u[1] + p[v * 3 + 2] * u[2];
    const b: number = p[v * 3] * w[0] + p[v * 3 + 1] * w[1] + p[v * 3 + 2] * w[2];
    uLow = Math.min(uLow, a);
    uHigh = Math.max(uHigh, a);
    wLow = Math.min(wLow, b);
    wHigh = Math.max(wHigh, b);
  }
  return { length: uHigh - uLow, breadth: wHigh - wLow };
}
