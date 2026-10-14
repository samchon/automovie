import {
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Project one world point orthographically onto the view's page, unrounded.
 *
 * The page coordinates are the point's offset from the frame origin measured
 * along the frame's right and up axes, in metres; depth along the normal is
 * dropped. Callers round onto the drawing grid when they store the result.
 *
 * @param frame Orthonormal page basis of the view.
 * @param point World point in metres.
 * @returns The page point in metres.
 *
 * @evidence contracts/common.md#principled-implementation Orthographic projection as two dot products with the frame's in-plane axes, exact for the orthonormal basis `autoMovieDrawingFrame` returns.
 * @evidence contracts/common.md#clear-and-simple-design The one world-to-page mapping every line, region corner, opening outline, dimension and note uses, so they share one page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point or view is special-cased, and rounding is left to the callers that store the result so intermediate arithmetic stays exact.
 * @evidence contracts/common.md#meaningful-documentation The comment states the projection, the axes, the unit, that depth is dropped and that the result is unrounded.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One subtraction and two dot products, so there is no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Two dot products per point; a cache keyed by point would cost a hash and an allocation to save less than it spends.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary offset vector is dropped on return and the page point goes to the caller, which rounds it straight away.
 * @author Samchon
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
