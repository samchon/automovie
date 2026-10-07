import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadPair } from "./IAutoMovieHumanHeadPair";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadEar } from "./humanHeadEar";

/**
 * Find the zygia on a head view: "the most lateral point on the zygomatic
 * arch" (ANSUR II 5.2.47, Hotzman et al. 2011, p. 71), whose span is the
 * bizygomatic breadth, "the maximum horizontal breadth of the face between
 * the zygomatic arches" (6.4.16, p. 92).
 *
 * The arch lies under the skin between the ear and the orbit, so each side is
 * searched over the head view's vertices anterior to the most anterior vertex
 * of that side's named ear area and between the tragion and sellion heights,
 * the triangles of both ear areas left out. That height band and the anterior
 * bound are a stated convention for where the arch lies, not part of the
 * definition: a bound at the tragion alone let the search settle on the
 * preauricular skin at the ear root. The most
 * lateral vertex of each side is the zygion. A side with no vertex in the
 * band refuses by name, and so does a side whose most lateral vertex lies
 * within 2 mm of the anterior bound: there the skin keeps widening toward
 * the ear, the arch makes no lateral maximum of its own, and the bound alone
 * would set the reading. The 2 mm margin is a stated convention.
 *
 * @evidence contracts/common.md#principled-implementation The zygia are lateral extremes found on each skin within a stated face band.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the triangles that remain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty side and a bound-set extreme refuse; the band is a documented convention.
 * @evidence contracts/common.md#meaningful-documentation States both protocol sentences, the search band, its status and both refusals.
 * @evidence contracts/modeling.md#spatial-conventions Right is -X; heights along +Y; anterior is +Z.
 * @evidence contracts/anatomy.md#anatomical-source Follows ANSUR II 5.2.47 and 6.4.16.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function findHumanZygia(
  head: IAutoMovieHumanHeadSkin,
  tragion: IAutoMovieHumanHeadPair,
  sellion: IAutoMovieVector3,
  rightEar: string,
  leftEar: string,
): IAutoMovieHumanHeadPair {
  const p = head.positions;
  const ears = [humanHeadEar(head, rightEar), humanHeadEar(head, leftEar)];
  const excluded = new Set([...ears[0].triangles, ...ears[1].triangles]);
  const front = (region: string): number =>
    Math.max(...head.skinRegions![region].vertices.map((v) => p[v * 3 + 2]));
  const frontRight = front(rightEar);
  const frontLeft = front(leftEar);
  let right: IAutoMovieVector3 | undefined;
  let left: IAutoMovieVector3 | undefined;
  const low = Math.min(tragion.right.y, tragion.left.y);
  for (let t = 0; t < head.indices.length / 3; t++) {
    if (excluded.has(t)) continue;
    for (let k = 0; k < 3; k++) {
      const v = head.indices[t * 3 + k];
      const point = { x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] };
      if (point.y < low || point.y > sellion.y) continue;
      if (
        point.x < 0 &&
        point.z > frontRight &&
        (right === undefined || point.x < right.x)
      )
        right = point;
      if (
        point.x > 0 &&
        point.z > frontLeft &&
        (left === undefined || point.x > left.x)
      )
        left = point;
    }
  }
  if (right === undefined || left === undefined)
    throw new Error(
      `The head view of ${head.id} has no face skin in the zygomatic band.`,
    );
  if (right.z - frontRight < 0.002 || left.z - frontLeft < 0.002)
    throw new Error(
      `missing rule: zygion on ${head.id}; the skin keeps widening toward the ear root, so its most lateral point in the zygomatic band lies on the band's anterior bound and the arch shows no lateral maximum of its own`,
    );
  return { right, left };
}
