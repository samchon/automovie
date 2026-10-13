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
