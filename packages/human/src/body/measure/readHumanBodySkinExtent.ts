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
  const direction = rule.across
    ? { x: -z / length, z: x / length }
    : { x: x / length, z: z / length };
  let lowest = Infinity;
  let highest = -Infinity;
  for (const [index, surface] of basis.surfaces.entries()) {
    const positions = surfaces[index];
    if (positions === undefined) continue;
    for (const vertex of humanBodyDominantVertices(surface, rule.bones)) {
      const along =
        positions[vertex * 3] * direction.x +
        positions[vertex * 3 + 2] * direction.z;
      if (along < lowest) lowest = along;
      if (along > highest) highest = along;
    }
  }
  return highest >= lowest ? highest - lowest : null;
}
