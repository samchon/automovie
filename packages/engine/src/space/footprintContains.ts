import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { footprintRingPlacement } from "./footprintRingPlacement";

/**
 * Is `(x, z)` on the surface the footprint describes?
 *
 * The region is closed: the outer rim and every hole rim belong to it, because
 * the slab physically reaches its own edge and a foot on the lip of an atrium
 * is standing on concrete. Only the open interior of a hole is off the
 * surface.
 *
 * A ring enclosing no area (fewer than three points, or all of them collinear)
 * covers nothing, matching what the hull query answered before holes existed;
 * `validateSpace` refuses such a footprint, so this is what a hand-built patch
 * reaching a renderer reads as rather than a throw.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `footprintContains` answers "Is `(x, z)` on the surface the footprint describes?" This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `footprintContains` performs contains footprint evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
export const footprintContains = (
  footprint: IAutoMovieFootprint,
  x: number,
  z: number,
): boolean => {
  if (footprint.outer.doubleArea === 0) return false;
  if (footprintRingPlacement(footprint.outer, x, z) === "outside") return false;
  return footprint.holes.every(
    (hole) => footprintRingPlacement(hole, x, z) !== "inside",
  );
};
