import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { footprintConvexPieces } from "./footprintConvexPieces";
import { footprintRing } from "./footprintRing";

/**
 * A plan point guaranteed to be on the region, or `null` when it has none.
 *
 * The mean of a ring's own vertices is not on the region that ring bounds: an
 * L-shaped plate's mean falls in its notch and a holed slab's falls straight
 * down the atrium, so anything anchoring to "the middle of the patch" that way
 * anchors where the patch is not. The mean of a convex piece is always inside
 * that piece, and the widest piece is chosen so the anchor sits in the part of
 * the patch there is most of. A patch that was already convex is its own widest
 * piece, so the answer is unchanged wherever it was already right.
 */
export const footprintInteriorPoint = (
  footprint: IAutoMovieFootprint,
): { x: number; z: number } | null => {
  let best: IAutoMovieVector3[] | null = null;
  let bestArea = 0;
  for (const piece of footprintConvexPieces(footprint)) {
    const area = Math.abs(footprintRing(piece).doubleArea);
    if (area > bestArea) {
      best = piece;
      bestArea = area;
    }
  }
  if (best === null) return null;
  const sum = best.reduce(
    (total, point) => ({ x: total.x + point.x, z: total.z + point.z }),
    { x: 0, z: 0 },
  );
  return { x: sum.x / best.length, z: sum.z / best.length };
};
