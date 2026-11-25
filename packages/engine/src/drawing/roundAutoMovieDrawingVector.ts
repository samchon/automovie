import { IAutoMovieVector3 } from "@automovie/interface";

import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * Round all three components of a world vector onto the drawing grid.
 *
 * Used for the world values a drawing or schedule stores, such as the drawing's
 * page frame and a room's declared and content boxes, so they share the page
 * precision and never carry `-0`.
 *
 * @param vector World vector or point.
 * @returns A new vector on the grid.
 */
export const roundAutoMovieDrawingVector = (
  vector: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: roundAutoMovieDrawingScalar(vector.x),
  y: roundAutoMovieDrawingScalar(vector.y),
  z: roundAutoMovieDrawingScalar(vector.z),
});
