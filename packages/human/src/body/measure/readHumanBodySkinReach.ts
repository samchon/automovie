import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinReach } from "../structures/IAutoMovieHumanBodySkinReach";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";
import { readHumanBodySkinPoint } from "./readHumanBodySkinPoint";

/**
 * Read the maximum skin-region projection beyond a named skin origin along a joint axis, in metres or null.
 *
 * A shared dominant-weight region selects current source vertices, whose displacement from the named shaped skin point is projected onto the from-to direction. Admitted matching finite surfaces remain caller premises. Missing origin/region, a sub-1e-9 metre or unrepresentable axis and nonfinite results are unavailable. Signed reach can be negative; this is a geometric instrument rather than an internal bone, tissue or clinical measurement.
 *
 * @evidence contracts/common.md#principled-implementation Current dominant-weight region vertices are projected beyond the shared named skin origin on the normalized landmark axis, keeping the greatest actual signed metre reading.
 * @evidence contracts/common.md#clear-and-simple-design Shared region selection and named point lookup feed one axial projection walk without freezing witness vertices from another shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing witnesses and degenerate/unrepresentable arithmetic return null; the fixed axis threshold is numerical policy and rig attachment regions cannot certify tissue anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose defines signed maximum, common source order, metre/null meaning, finite axis refusal and admitted array premises.
 * @evidence contracts/performance.md#efficient-algorithms Every admitted skin row is considered by the shared dominant selector, then only selected vertices are projected; work follows actual surface populations and requested region bones.
 * @evidence contracts/performance.md#reuse-equivalent-work Source correspondence and dominant-weight policy are shared with extent and support readers, while current geometry prevents cross-shape extremum reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-surface ordinal lists expire after projection and only a scalar/null reading escapes, with no retained shape arrays, handle or task.
 */
export function readHumanBodySkinReach(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  rule: IAutoMovieHumanBodySkinReach,
): number | null {
  const axis: IAutoMovieVector3 = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const length: number = Math.hypot(axis.x, axis.y, axis.z);
  const origin: IAutoMovieVector3 | null = readHumanBodySkinPoint(basis, surfaces, rule.origin);
  if (!Number.isFinite(length) || length < 1e-9 || origin === null) return null;
  let farthest: number = -Infinity;
  for (const [index, surface] of basis.surfaces.entries()) {
    const positions: readonly number[] | undefined = surfaces[index];
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
