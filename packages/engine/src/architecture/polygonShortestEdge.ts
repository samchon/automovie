import { IAutoMoviePlanarPoint } from "@automovie/interface";

/** The shortest edge length of a closed polygon. */
export const polygonShortestEdge = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number =>
  Math.min(
    ...polygon.map((point, index) => {
      const next = polygon[(index + 1) % polygon.length]!;
      return Math.hypot(next.x - point.x, next.y - point.y);
    }),
  );
