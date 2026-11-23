import type {
  IAutoMovieFootprint,
  IAutoMovieFootprintRing,
} from "@automovie/interface";

import { footprintRingPlacement } from "./footprintRingPlacement";

/**
 * Is `(x, z)` on the surface the footprint describes?
 *
 * The region is closed: the outer rim and every hole rim belong to it, because
 * the slab physically reaches its own edge and a foot on the lip of an atrium
 * is standing on concrete. Only the open interior of a hole is off the
 * surface.
 *
 * A zero cached outer area covers nothing. Ring queries separately reject fewer
 * than three points; this function does not validate arbitrary topology or
 * catch the shared segment query's finite-arithmetic admission failures.
 */
export const footprintContains: (
  footprint: IAutoMovieFootprint,
  x: number,
  z: number,
) => boolean = (
  footprint: IAutoMovieFootprint,
  x: number,
  z: number,
): boolean => {
  if (footprint.outer.doubleArea === 0) return false;
  if (footprintRingPlacement(footprint.outer, x, z) === "outside") return false;
  return footprint.holes.every(
    (hole: IAutoMovieFootprintRing): boolean =>
      footprintRingPlacement(hole, x, z) !== "inside",
  );
};
