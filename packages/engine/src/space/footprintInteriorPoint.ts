import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { footprintConvexPieces } from "./footprintConvexPieces";
import { footprintRing } from "./footprintRing";

/**
 * Choose an anchor from the widest convex piece of a footprint.
 *
 * @evidence contracts/common.md#principled-implementation The largest absolute shoelace area wins, with first-piece ties, and its vertex mean lies in that convex piece under representable arithmetic; decomposition preserves admitted positive bands, while binary64 orientation/interpolation still limit extreme coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The anchor owner composes the canonical decomposition and ring-area owners rather than averaging a concave outer ring into a notch or hole.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence of a positive measured piece returns null; no fallback center is invented. Direct area/coordinate sums can overflow, so finite authored coordinates alone do not establish a valid returned anchor.
 * @evidence contracts/common.md#meaningful-documentation Documents nullable anchor, widest-piece/first-tie selection and the remaining dependency on decomposition fidelity rather than claiming unconditional admitted-region containment.
 * @evidence contracts/performance.md#efficient-algorithms The full decomposition cost precedes one scan of returned vertices for piece areas and one scan of the winning piece for its mean; the decomposition allocation dominates storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One completed decomposition serves area ranking and anchor selection within the call; no stale mutable-footprint anchor cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh scalar point or null; piece populations and temporary sums leave scope, with no source mutation or external resource acquisition.
 */
export const footprintInteriorPoint: (
  footprint: IAutoMovieFootprint,
) => { x: number; z: number } | null = (
  footprint: IAutoMovieFootprint,
): { x: number; z: number } | null => {
  let best: IAutoMovieVector3[] | null = null;
  let bestArea: number = 0;
  for (const piece of footprintConvexPieces(footprint)) {
    const area: number = Math.abs(footprintRing(piece).doubleArea);
    if (area > bestArea) {
      best = piece;
      bestArea = area;
    }
  }
  if (best === null) return null;
  const sum: { x: number; z: number } = best.reduce(
    (
      total: { x: number; z: number },
      point: IAutoMovieVector3,
    ): { x: number; z: number } => ({
      x: total.x + point.x,
      z: total.z + point.z,
    }),
    { x: 0, z: 0 },
  );
  return { x: sum.x / best.length, z: sum.z / best.length };
};
