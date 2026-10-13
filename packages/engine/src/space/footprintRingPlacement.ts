import { pointInPolygon } from "../architecture/pointInPolygon";
import { closestPointOnSegmentXZ } from "../math/closestPointOnSegmentXZ";
import { AutoMovieRingPlacement } from "./AutoMovieRingPlacement";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
import { FOOTPRINT_EPSILON } from "./constants/FOOTPRINT_EPSILON";

/**
 * Where `(x, z)` stands relative to one ring.
 *
 * The rim is answered before the crossing test, so a point sitting exactly on
 * an edge is `"boundary"` rather than whichever side the parity happened to
 * land on. A ring of fewer than three points bounds nothing, so every point is
 * outside it.
 */
export const footprintRingPlacement = (
  ring: IAutoMovieFootprintRing,
  x: number,
  z: number,
): AutoMovieRingPlacement => {
  if (ring.points.length < 3) return "outside";
  const probe = { x, y: 0, z };
  for (let index = 0; index < ring.points.length; ++index) {
    const near = closestPointOnSegmentXZ(
      probe,
      ring.points[index]!,
      ring.points[(index + 1) % ring.points.length]!,
    );
    if (Math.hypot(x - near.x, z - near.z) <= FOOTPRINT_EPSILON)
      return "boundary";
  }
  return pointInPolygon({ x, y: z }, ring.plan) ? "inside" : "outside";
};
