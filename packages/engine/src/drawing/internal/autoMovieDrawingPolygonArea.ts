import { IAutoMovieDrawingPoint } from "@automovie/interface";

import { polygonDoubleArea } from "../../architecture/internal/polygonDoubleArea";

/**
 * Unsigned area of a simple page polygon, in square metres.
 *
 * The polygon is an implicitly closed ring, so the result does not depend on
 * its winding. Fewer than three corners enclose nothing and yield `0`. A
 * self-crossing ring yields the net of its lobes, so callers pass simple
 * polygons, such as the convex cell sections the drafter produces.
 *
 * @param polygon Page corners in metres.
 * @returns The enclosed area in square metres.
 */
export const autoMovieDrawingPolygonArea = (
  polygon: readonly IAutoMovieDrawingPoint[],
): number => Math.abs(polygonDoubleArea(polygon)) / 2;
