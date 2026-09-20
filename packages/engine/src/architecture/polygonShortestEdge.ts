import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The shortest edge length of a closed polygon.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `polygonShortestEdge` produces the shortest edge length of a closed polygon. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `polygonShortestEdge` performs shortest edge polygon calculation when the engine checks finite planar topology before consuming geometry.
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
