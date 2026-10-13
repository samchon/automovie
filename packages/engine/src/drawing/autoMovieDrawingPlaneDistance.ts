import {
  IAutoMovieDrawingFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Signed distance from the cut plane; positive is the viewer's side. */
export const autoMovieDrawingPlaneDistance = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): number => Vector3.dot(Vector3.subtract(point, frame.origin), frame.normal);
