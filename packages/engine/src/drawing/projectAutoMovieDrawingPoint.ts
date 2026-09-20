import { IAutoMovieDrawingFrame, IAutoMovieDrawingPoint, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

/**
 * Project one world point onto the page, without rounding.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Maps an exact world coordinate to the two page coordinates used by derived linework and regions.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Projects the point's frame-relative offset onto the view's right and up axes without premature rounding.
 */
export const projectAutoMovieDrawingPoint = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): IAutoMovieDrawingPoint => {
  const local = Vector3.subtract(point, frame.origin);
  return {
    x: Vector3.dot(local, frame.right),
    y: Vector3.dot(local, frame.up),
  };
};
