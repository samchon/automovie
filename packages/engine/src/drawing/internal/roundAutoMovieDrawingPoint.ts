import { IAutoMovieDrawingPoint } from "@automovie/interface";

import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/*
 * Round both coordinates of a page point onto the drawing grid.
 *
 * Every page point a drawing stores passes through here, so lines, regions,
 * opening outlines, dimension ends and note anchors share one precision and a
 * point never carries `-0`.
 * Parameter point: Page point in metres.
 * Returns: A new page point on the grid.
 */
export const roundAutoMovieDrawingPoint = (
  point: IAutoMovieDrawingPoint,
): IAutoMovieDrawingPoint => ({
  x: roundAutoMovieDrawingScalar(point.x),
  y: roundAutoMovieDrawingScalar(point.y),
});
