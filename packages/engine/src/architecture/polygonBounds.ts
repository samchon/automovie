import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The axis-aligned bounds of a polygon in its own planar frame.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `polygonBounds` produces the axis-aligned bounds of a polygon in its own planar frame. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `polygonBounds` performs bounds polygon calculation when the engine checks finite planar topology before consuming geometry.
 */
export const polygonBounds = (
  polygon: readonly IAutoMoviePlanarPoint[],
): { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } => ({
  min: {
    x: Math.min(...polygon.map((point) => point.x)),
    y: Math.min(...polygon.map((point) => point.y)),
  },
  max: {
    x: Math.max(...polygon.map((point) => point.x)),
    y: Math.max(...polygon.map((point) => point.y)),
  },
});
