import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinReach } from "../structures/IAutoMovieHumanBodySkinReach";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";
import { readHumanBodySkinPoint } from "./readHumanBodySkinPoint";

/**
 * Read how far a skin region reaches past a named skin point along a joint
 * axis (`IAutoMovieHumanBodySkinReach`), in metres, or null when the axis is
 * degenerate, the point is undeclared or the region is empty.
 *
 * @evidence contracts/common.md#principled-implementation The free end is the region's extreme on the shaped skin, so it follows every shape.
 * @evidence contracts/common.md#clear-and-simple-design One pass over each surface's region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each missing input answers null instead of a substituted value.
 * @evidence contracts/common.md#meaningful-documentation States the reading and the null cases.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The dominant-weight region is a rig attachment, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a number.
 * @evidence contracts/modeling.md#spatial-conventions Reads metre positions in the basis frame along the joint axis.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder owns the skin it reads.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measured channel's consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns the survey definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range It bounds no authored value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It receives already evaluated geometry.
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
