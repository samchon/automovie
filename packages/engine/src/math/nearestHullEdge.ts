import {
  type IAutoMovieHullEdge,
  IAutoMovieVector3,
} from "@automovie/interface";

import { closestPointOnSegmentXZ } from "./closestPointOnSegmentXZ";

/**
 * The hull boundary edge nearest to `point`, the tip-over axis when an object
 * topples over that edge. A single-vertex hull degenerates to a zero-length
 * edge at that vertex. Empty hulls throw because no boundary edge exists.
 * Endpoints alias the hull's own point records; equal computed distances keep
 * the first declared edge.
 */
export const nearestHullEdge: (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
) => IAutoMovieHullEdge = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): IAutoMovieHullEdge => {
  if (hull.length === 0)
    throw new Error("Nearest hull edge needs a nonempty hull.");
  if (hull.length === 1)
    return {
      start: hull[0]!,
      end: hull[0]!,
      distance: distanceXZ(point, hull[0]!),
    };
  const edgeCount: number = hull.length === 2 ? 1 : hull.length;
  let best: IAutoMovieHullEdge = {
    start: hull[0]!,
    end: hull[1]!,
    distance: Infinity,
  };
  for (let i: number = 0; i < edgeCount; i++) {
    const start: IAutoMovieVector3 = hull[i]!;
    const end: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
    const distance: number = distanceXZ(
      point,
      closestPointOnSegmentXZ(point, start, end),
    );
    if (distance < best.distance) best = { start, end, distance };
  }
  return best;
};

const distanceXZ: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => Math.hypot(a.x - b.x, a.z - b.z);
