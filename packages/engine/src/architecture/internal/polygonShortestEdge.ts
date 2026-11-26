import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The shortest edge length of a closed polygon.
 *
 * Includes the closing edge and measures Euclidean length in polygon units. An
 * empty ring returns `Infinity`; repeated consecutive finite corners and a
 * one-point ring return zero. Coordinate subtraction or a non-representable
 * final length can still overflow despite `Math.hypot`'s scaled evaluation.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The minimum edge length, or `Infinity` for an empty ring.
 */
export function polygonShortestEdge(
  polygon: readonly IAutoMoviePlanarPoint[],
): number {
  let shortest: number = Infinity;
  for (let index: number = 0; index < polygon.length; ++index) {
    const point: IAutoMoviePlanarPoint = polygon[index]!;
    const next: IAutoMoviePlanarPoint = polygon[(index + 1) % polygon.length]!;
    shortest = Math.min(
      shortest,
      Math.hypot(next.x - point.x, next.y - point.y),
    );
  }
  return shortest;
}
