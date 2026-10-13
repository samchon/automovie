import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The shortest edge length of a closed polygon.
 *
 * Edges include the closing edge from the last point back to the first, and
 * lengths are Euclidean in the polygon's own units. An empty polygon returns
 * `Infinity`; a ring repeating a point at consecutive corners returns 0, which
 * is how validation detects that defect.
 */
export const polygonShortestEdge = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number =>
  Math.min(
    ...polygon.map((point, index) => {
      const next = polygon[(index + 1) % polygon.length]!;
      return Math.hypot(next.x - point.x, next.y - point.y);
    }),
  );
