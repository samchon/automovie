import {
  IAutoMovieDrawingFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Signed distance in metres from a view's cut plane to a world point.
 *
 * The cut plane passes through the frame's origin with the frame's unit normal,
 * which points back at the viewer, so a positive distance is on the viewer's
 * side, the side a cut removes, and a negative one lies beyond the plane.
 * Parameter frame: Page basis whose origin and unit normal define the plane.
 * Parameter point: World point in metres.
 * Returns: `(point - origin) . normal`, in metres.
 */
export const drawingPlaneDistance = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): number => AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(point, frame.origin), frame.normal);
