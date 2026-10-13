import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * The polar angle from the crown at which a layer's hairline lies in the azimuth of a neutral chart direction: the four authored angles (front, back, left, right) blended by the squared horizontal components of the direction, so the boundary is smooth all around the head. On the polar axis, where azimuth is undefined, it is the smallest of the four. Root sampling and the scalp's own coverage both read it, so a document states one hairline.
 *
 * @evidence contracts/common.md#principled-implementation Squared horizontal components blend the four authored directional polar boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Sampling and coverage use one neutral-chart hairline boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The polar axis takes the minimum of all angles as an explicit azimuth-undefined convention, not inferred regional anatomy.
 * @evidence contracts/common.md#meaningful-documentation Returned polar angle is radians from the crown, with +X left and +Z front choices.
 * @evidence contracts/performance.md#efficient-algorithms Fixed hypot, directional selection and weighted sums take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared boundary eliminates separate mask and tint azimuth formulas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes and the borrowed hairline remains unchanged.
 */
export function humanFaceHairlineBoundary(
  direction: IAutoMovieVector3,
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
): number {
  const horizontal: number = Math.hypot(direction.x, direction.z);
  // At the polar axis azimuth is undefined. Both limits have theta=0 or
  // pi; the minimum boundary is the intersection of those azimuth limits.
  return horizontal === 0
    ? Math.min(...Object.values(hairline))
    : (direction.x / horizontal) ** 2 *
        (direction.x < 0 ? hairline.right : hairline.left) +
        (direction.z / horizontal) ** 2 *
          (direction.z < 0 ? hairline.back : hairline.front);
}
