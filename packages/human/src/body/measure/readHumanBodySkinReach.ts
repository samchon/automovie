import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinReach } from "../structures/IAutoMovieHumanBodySkinReach";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";
import { readHumanBodySkinPoint } from "./readHumanBodySkinPoint";

/**
 * Read how far a skin region reaches past a named skin point along a joint
 * axis (`IAutoMovieHumanBodySkinReach`), in metres, or null when the axis is
 * degenerate, the point is undeclared or the region is empty.
 */
export function readHumanBodySkinReach(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  rule: IAutoMovieHumanBodySkinReach,
): number | null {
  const axis = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const length = Math.hypot(axis.x, axis.y, axis.z);
  const origin = readHumanBodySkinPoint(basis, surfaces, rule.origin);
  if (length < 1e-9 || origin === null) return null;
  let farthest = -Infinity;
  for (const [index, surface] of basis.surfaces.entries()) {
    const positions = surfaces[index];
    if (positions === undefined) continue;
    for (const vertex of humanBodyDominantVertices(surface, rule.bones))
      farthest = Math.max(
        farthest,
        ((positions[vertex * 3] - origin.x) * axis.x +
          (positions[vertex * 3 + 1] - origin.y) * axis.y +
          (positions[vertex * 3 + 2] - origin.z) * axis.z) /
          length,
      );
  }
  return Number.isFinite(farthest) ? farthest : null;
}
