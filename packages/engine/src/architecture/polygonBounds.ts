import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The axis-aligned bounds of a polygon in its own planar frame.
 *
 * Returns the componentwise minimum and maximum of the points, in the
 * polygon's own units. An empty polygon yields `Infinity` for `min` and
 * `-Infinity` for `max` rather than throwing, so callers pass a non-empty
 * outline, which validation guarantees for every face and opening.
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
