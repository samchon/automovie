import { IAutoMovieVector3 } from "@automovie/interface";

import { roundDrawingScalar } from "./roundDrawingScalar";

/*
 * Round all three components of a world vector onto the drawing grid.
 *
 * Used for the world values a drawing or schedule stores, such as the drawing's
 * page frame and a room's declared and content boxes, so they share the page
 * precision and never carry `-0`.
 * Parameter vector: World vector or point.
 * Returns: A new vector on the grid.
 */
export const roundDrawingVector = (
  vector: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: roundDrawingScalar(vector.x),
  y: roundDrawingScalar(vector.y),
  z: roundDrawingScalar(vector.z),
});
