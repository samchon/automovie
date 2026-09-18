import { pointInPolygon } from "../architecture/pointInPolygon";
import { closestPointOnSegmentXZ } from "../math/closestPointOnSegmentXZ";
import { AutoMovieRingPlacement } from "./AutoMovieRingPlacement";
import { FOOTPRINT_EPSILON } from "./FOOTPRINT_EPSILON";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/**
 * Where `(x, z)` stands relative to one ring.
 *
 * The rim is answered before the crossing test, so a point sitting exactly on
 * an edge is `"boundary"` rather than whichever side the parity happened to
 * land on. A ring of fewer than three points bounds nothing, so every point is
 * outside it.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `footprintRingPlacement` returns where `(x, z)` stands relative to one ring. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `footprintRingPlacement` performs ring placement footprint evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
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
