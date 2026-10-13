import { IAutoMoviePlanarPoint } from "@automovie/interface";

/** The axis-aligned bounds of a polygon in its own planar frame. */
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
