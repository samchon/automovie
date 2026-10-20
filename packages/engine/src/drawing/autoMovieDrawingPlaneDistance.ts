import {
  IAutoMovieDrawingFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Signed distance in metres from a view's cut plane to a world point.
 *
 * The cut plane passes through the frame's origin with the frame's unit normal,
 * which points back at the viewer, so a positive distance is on the viewer's
 * side, the side a cut removes, and a negative one lies beyond the plane.
 *
 * @param frame Page basis whose origin and unit normal define the plane.
 * @param point World point in metres.
 * @returns `(point - origin) . normal`, in metres.
 *
 * @evidence contracts/common.md#principled-implementation The point-plane distance as the dot product of the offset with the plane's unit normal, exact up to rounding because `autoMovieDrawingFrame` returns a normalized normal.
 * @evidence contracts/common.md#clear-and-simple-design One definition of the side test shared by cut extraction, clipping and depth classification, so every pass agrees on which side a corner is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point or view is special-cased, and the tolerance is applied by the callers that classify, not folded into the distance.
 * @evidence contracts/common.md#meaningful-documentation The comment states the plane's definition, the sign convention and what each sign means for a cut, and the unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One subtraction and one dot product, so there is no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time pure function; caching a distance would cost more than computing it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one temporary vector and retains nothing.
 */
export const autoMovieDrawingPlaneDistance = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): number => Vector3.dot(Vector3.subtract(point, frame.origin), frame.normal);
