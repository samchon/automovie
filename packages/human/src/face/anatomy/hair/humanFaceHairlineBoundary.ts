import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * The polar angle from the crown at which a layer's hairline lies in the
 * azimuth of a neutral chart direction: the four authored angles (front,
 * back, left, right) blended by the squared horizontal components of the
 * direction, so the boundary is smooth all around the head. On the polar
 * axis, where azimuth is undefined, it is the smallest of the four. Root
 * sampling and the scalp's own coverage both read it, so a document states
 * one hairline.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Reads one shared hairline rule from four scalar angles for every identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Blends the front, back, left and right hairline angles by the squared horizontal chart components.
 */
export function humanFaceHairlineBoundary(
  direction: IAutoMovieVector3,
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
): number {
  const horizontal = Math.hypot(direction.x, direction.z);
  // At the polar axis azimuth is undefined. Both limits have theta=0 or
  // pi; the minimum boundary is the intersection of those azimuth limits.
  return horizontal === 0
    ? Math.min(...Object.values(hairline))
    : (direction.x / horizontal) ** 2 *
        (direction.x < 0 ? hairline.right : hairline.left) +
        (direction.z / horizontal) ** 2 *
          (direction.z < 0 ? hairline.back : hairline.front);
}
