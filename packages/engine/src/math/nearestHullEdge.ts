import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieHullEdge } from "./IAutoMovieHullEdge";
import { closestPointOnSegmentXZ } from "./closestPointOnSegmentXZ";

/**
 * The hull boundary edge nearest to `point`, the tip-over axis when an object
 * topples over that edge. A single-vertex hull degenerates to a zero-length
 * edge at that vertex.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Selects the support edge about which an unstable body would tip.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Selects the support edge about which an unstable body would tip.
 */
export const nearestHullEdge = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): IAutoMovieHullEdge => {
  if (hull.length === 1)
    return {
      start: hull[0]!,
      end: hull[0]!,
      distance: distanceXZ(point, hull[0]!),
    };
  const edgeCount = hull.length === 2 ? 1 : hull.length;
  let best: IAutoMovieHullEdge = {
    start: hull[0]!,
    end: hull[1]!,
    distance: Infinity,
  };
  for (let i = 0; i < edgeCount; i++) {
    const start = hull[i]!;
    const end = hull[(i + 1) % hull.length]!;
    const distance = distanceXZ(
      point,
      closestPointOnSegmentXZ(point, start, end),
    );
    if (distance < best.distance) best = { start, end, distance };
  }
  return best;
};
