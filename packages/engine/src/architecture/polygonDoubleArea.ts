import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `polygonDoubleArea` produces twice the signed area of a closed polygon, positive when counter-clockwise. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `polygonDoubleArea` performs area calculation when the engine checks finite planar topology before consuming geometry.
 */
export const polygonDoubleArea = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number => {
  let sum = 0;
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    sum += point.x * next.y - next.x * point.y;
  });
  return sum;
};
