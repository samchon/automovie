import {
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";

/*
 * Project one world point orthographically onto the view's page, unrounded.
 *
 * The page coordinates are the point's offset from the frame origin measured
 * along the frame's right and up axes, in metres; depth along the normal is
 * dropped. Callers round onto the drawing grid when they store the result.
 * Parameter frame: Orthonormal page basis of the view.
 * Parameter point: World point in metres.
 * Returns: The page point in metres.
 */
export const projectAutoMovieDrawingPoint = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): IAutoMovieDrawingPoint => {
  const local: IAutoMovieVector3 = Vector3.subtract(point, frame.origin);
  return {
    x: Vector3.dot(local, frame.right),
    y: Vector3.dot(local, frame.up),
  };
};
