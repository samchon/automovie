import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinExtent } from "../structures/IAutoMovieHumanBodySkinExtent";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";

/**
 * Read a skin extent rule on already shaped surfaces, in metres, or null.
 *
 * The region is every vertex dominantly weighted to one of the rule's bones
 * (`humanBodyDominantVertices`). The axis is the `from`→`to` landmark
 * direction with its vertical component removed; `across` turns it a quarter
 * about +Y. The reading is the largest minus the smallest projection of the
 * region's shaped positions on that horizontal direction, as a caliper or a
 * Brannock device reads between two parallel vertical blades. The extremes
 * are found on the given shape, never fixed to vertices chosen on another
 * shape. A vertical axis or an empty region answers null.
 *
 * @evidence contracts/common.md#principled-implementation Extremes are searched on the shaped skin and the region follows the rig's dominant weights, so the instrument follows every shape.
 * @evidence contracts/common.md#clear-and-simple-design One pass over each surface's region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A degenerate axis or empty region answers null instead of a substituted value.
 * @evidence contracts/common.md#meaningful-documentation States the region rule, the axis, the reading and the null cases.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The dominant-weight region is a rig attachment, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a number, never geometry.
 * @evidence contracts/modeling.md#spatial-conventions Reads metre positions in the basis frame; horizontal is perpendicular to +Y.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder owns the skin it reads.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measured channel's consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule in HUMAN_BODY_MEASUREMENTS owns the survey definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reads and bounds no authored value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It receives already evaluated geometry.
 * @author Samchon
 */
export function readHumanBodySkinExtent(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  rule: IAutoMovieHumanBodySkinExtent,
): number | null {
  const x = to.x - from.x;
  const z = to.z - from.z;
  const length = Math.hypot(x, z);
  if (length < 1e-9) return null;
  const direction = rule.across ? { x: -z / length, z: x / length } : { x: x / length, z: z / length };
  let lowest = Infinity;
  let highest = -Infinity;
  for (const [index, surface] of basis.surfaces.entries()) {
    const positions = surfaces[index];
    if (positions === undefined) continue;
    for (const vertex of humanBodyDominantVertices(surface, rule.bones)) {
      const along = positions[vertex * 3] * direction.x + positions[vertex * 3 + 2] * direction.z;
      if (along < lowest) lowest = along;
      if (along > highest) highest = along;
    }
  }
  return highest >= lowest ? highest - lowest : null;
}
