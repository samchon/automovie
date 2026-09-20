import { IAutoMovieDrawingFrame, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

/**
 * Signed distance from the cut plane; positive is the viewer's side.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Locates a world point on the viewer side, far side, or surface of the drawing's cut plane.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Computes signed plane distance as the dot product of the frame-relative point and normalized view normal.
 */
export const autoMovieDrawingPlaneDistance = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): number => Vector3.dot(Vector3.subtract(point, frame.origin), frame.normal);
