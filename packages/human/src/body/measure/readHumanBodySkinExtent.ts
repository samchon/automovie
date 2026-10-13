import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinExtent } from "../structures/IAutoMovieHumanBodySkinExtent";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";

/**
 * Read a skin extent rule on already shaped surfaces, in metres, or null.
 *
 * Dominant weights select the requested rig-bone skin region. Its current positions are projected along the horizontal from-to axis, or the perpendicular (-z,x) direction for across. Largest minus smallest projection gives the caliper-style extent without fixing witness vertices from a previous shape. Admitted finite arrays retain source order; an empty region, sub-1e-9 metre axis or unrepresentable axis/projection/extent returns null. Rig attachment membership is not a segmented bone or tissue surface.
 *
 * @evidence contracts/common.md#principled-implementation Shared dominant-weight selection supplies actual current vertices whose extrema on the horizontal landmark direction or its perpendicular define one metre caliper extent.
 * @evidence contracts/common.md#clear-and-simple-design Region identity, horizontal axis and extrema remain separate from source shaping and named instrument rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degenerate axes, nonfinite projections/results and missing regions stay unavailable; no old witness vertex or rig-weight region can stand for clinical tissue anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose gives horizontal/across formula, source-order/finite caller premises, metre/null outputs and the fixed numerical threshold.
 * @evidence contracts/performance.md#efficient-algorithms Shared dominant selection walks actual four-slot skin populations and selected vertices need one projection/extremum update each, without sorting or iterative fitting.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing attachment-region selection serves the same extent/reach/support semantics while each changed shape gets freshly read extrema.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local ordinal lists and projection scalars expire; only the scalar/null reading escapes without retaining basis geometry or an external task.
 *
 * @author Samchon
 */
export function readHumanBodySkinExtent(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  rule: IAutoMovieHumanBodySkinExtent,
): number | null {
  const x: number = to.x - from.x;
  const z: number = to.z - from.z;
  const length: number = Math.hypot(x, z);
  if (!Number.isFinite(length) || length < 1e-9) return null;
  const direction: { x: number; z: number } = rule.across
    ? { x: -z / length, z: x / length }
    : { x: x / length, z: z / length };
  let lowest: number = Infinity;
  let highest: number = -Infinity;
  for (const [index, surface] of basis.surfaces.entries()) {
    const positions: readonly number[] | undefined = surfaces[index];
    if (positions === undefined) continue;
    for (const vertex of humanBodyDominantVertices(surface, rule.bones)) {
      const along: number =
        positions[vertex * 3] * direction.x +
        positions[vertex * 3 + 2] * direction.z;
      if (!Number.isFinite(along)) return null;
      if (along < lowest) lowest = along;
      if (along > highest) highest = along;
    }
  }
  const extent: number = highest - lowest;
  return highest >= lowest && Number.isFinite(extent) ? extent : null;
}
