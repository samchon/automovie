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
 * of that side's named ear area and between the lower of the two tragion
 * heights and the sellion height,
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
 * @evidence contracts/common.md#principled-implementation Ear-touching triangles are excluded and each lateral extreme must lie anterior to that ear's front and between tragion/sellion heights. The band and 2 mm anterior-bound refusal are declared skin approximations, not measured bone landmarks.
 * @evidence contracts/common.md#clear-and-simple-design The shared ear reader owns named-region admission; this instrument owns face-band extremes while craniofacial callers report the resulting span.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 2 mm margin explicitly refuses a boundary-controlled maximum instead of presenting it as a zygion; no specimen identity or expected breadth is used.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes palpated arch definition from source-skin band and documents ear exclusion, boundary margin and named gaps.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles and R ear vertices, two ear scans, union construction, anterior bounds and face traversal cost O(T+R) expected work and O(T+R) storage; selected region spreads remain input-sized.
 * @evidence contracts/performance.md#reuse-equivalent-work Each ear reading is reused for the exclusion union, and front bounds are computed once per region; no cross-shape maximum cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Ear/union sets and candidate arrays are invocation-owned and scale with the current head population; two chosen vectors transfer without handles or running tasks.
 */
export function findHumanZygia(
  head: IAutoMovieHumanHeadSkin,
  tragion: IAutoMovieHumanHeadPair,
  sellion: IAutoMovieVector3,
  rightEar: string,
  leftEar: string,
): IAutoMovieHumanHeadPair {
  const p: number[] = head.positions;
  const ears: ReturnType<typeof humanHeadEar>[] = [humanHeadEar(head, rightEar), humanHeadEar(head, leftEar)];
  const excluded: Set<number> = new Set([...ears[0].triangles, ...ears[1].triangles]);
  const front: (region: string) => number = (region: string): number =>
    Math.max(...head.skinRegions![region].vertices.map((v: number): number => p[v * 3 + 2]));
  const frontRight: number = front(rightEar);
  const frontLeft: number = front(leftEar);
  let right: IAutoMovieVector3 | undefined;
  let left: IAutoMovieVector3 | undefined;
  const low: number = Math.min(tragion.right.y, tragion.left.y);
  for (let t: number = 0; t < head.indices.length / 3; t++) {
    if (excluded.has(t)) continue;
    for (let k: number = 0; k < 3; k++) {
      const v: number = head.indices[t * 3 + k];
      const point: IAutoMovieVector3 = { x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] };
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
