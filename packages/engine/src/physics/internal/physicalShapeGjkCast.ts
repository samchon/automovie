import { physicalShapeGjkImplementation as implementation } from "./physicalShapeGjkImplementation";
import type { AutoMovieEnginePhysicsGjkTypes } from "../AutoMovieEnginePhysicsGjkTypes";

/**
 * The solid a shape sweeps between two placements, as a convex hull: both
 * placements' core points, widened by the larger radius and by a further
 * margin, the most any point of the shape strays from the straight chord
 * between its two places over the motion.
 *
 * @param from The shape at one end.
 * @param to The same shape at the other end, in the same frame.
 * @param stray The margin, metres, not negative.
 * @returns The cast.
 */
export function physicalShapeGjkCast(
  from: AutoMovieEnginePhysicsGjkTypes.ISolid,
  to: AutoMovieEnginePhysicsGjkTypes.ISolid,
  stray: number,
): AutoMovieEnginePhysicsGjkTypes.ISolid {
  return implementation.physicalShapeGjkCast(from, to, stray);
}
