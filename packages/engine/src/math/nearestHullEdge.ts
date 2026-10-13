import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieHullEdge } from "./IAutoMovieHullEdge";
import { closestPointOnSegmentXZ } from "./closestPointOnSegmentXZ";
/**
 * The hull boundary edge nearest to `point`, the tip-over axis when an object
 * topples over that edge. A single-vertex hull degenerates to a zero-length
 * edge at that vertex.
 * Empty hulls throw because no boundary edge exists. Endpoints alias the hull's
 * own point records; equal computed distances keep the first declared edge.
 *
 * @evidence contracts/common.md#principled-implementation A complete boundary scan minimizes horizontal segment distance, retaining the first equal-distance edge; singleton and two-vertex hulls have explicit degenerate edges.
 * @evidence contracts/common.md#clear-and-simple-design The shared XZ projection owns witnesses while this function owns edge selection for toppling and hull-distance consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex-only shortcut substitutes for edge distance; each admitted boundary edge receives the same projection.
 * @evidence contracts/common.md#meaningful-documentation States horizontal metric, toppling meaning, endpoint aliases, first-edge ties and singleton/empty behavior.
 * @evidence contracts/performance.md#efficient-algorithms For H hull corners, H constant-size edge queries take O(H) time with constant live best-edge storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Selection and distance measurement share one scan; a changed query point requires another boundary search.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the current best record remains during the call; its returned endpoints alias source vertices rather than copying hull geometry.
 */
export const nearestHullEdge: (point: IAutoMovieVector3, hull: readonly IAutoMovieVector3[]) => IAutoMovieHullEdge = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): IAutoMovieHullEdge => {
  if (hull.length === 0) throw new Error("Nearest hull edge needs a nonempty hull.");
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

const distanceXZ: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  Math.hypot(a.x - b.x, a.z - b.z);
