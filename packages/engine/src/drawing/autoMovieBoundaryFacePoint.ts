import {
  IAutoMovieBoundaryFace,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Place one boundary-local point in world space.
 *
 * The face's frame is a full rigid placement, so a wall out of plumb or a
 * sloping soffit resolves exactly here rather than being flattened to a
 * heading. `depth` walks along the face's own outward normal, which is how the
 * near and far faces of a separation of stated thickness are reached.
 *
 * The result is `origin + rotation * (x, y, depth)` in world metres: `point`
 * lies in the face's local XY plane and the local +Z axis is the outward
 * normal, so a negative `depth` moves inward. `face.rotation` is used as given
 * and must be a unit quaternion, which `validateBuiltEnvironment` requires.
 *
 * @param face Boundary face whose rigid frame places the point.
 * @param point Point in the face's planar outline frame, in metres.
 * @param depth Offset along the face's outward normal in metres, default 0.
 * @returns World position in metres.
 * @evidence contracts/common.md#principled-implementation A rigid transform, rotating the local offset by the face quaternion and adding the face origin, which preserves lengths and angles because the validator holds the rotation to unit norm within 1e-6.
 * @evidence contracts/common.md#clear-and-simple-design One helper shared by the drawing derivation and boundary-shell triangulation, so every face-local point reaches world space through the same frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize the quaternion or flatten the face to a heading, so a tilted face keeps its tilt; an unvalidated non-unit rotation would scale the offset, a case left to the validator.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the local axes and the outward sign of `depth`, the metre units, and the unit-quaternion premise and who enforces it.
 * @evidence contracts/performance.md#cost-and-resources Constant work per point, one quaternion rotation and one vector addition, allocating the offset and the result; shell triangulation calls it twice per outline corner, at depth 0 and at the face thickness, with no cache, and nothing is retained.
 */
export const autoMovieBoundaryFacePoint = (
  face: IAutoMovieBoundaryFace,
  point: IAutoMoviePlanarPoint,
  depth = 0,
): IAutoMovieVector3 =>
  Vector3.add(
    face.origin,
    Quaternion.rotateVector(face.rotation, {
      x: point.x,
      y: point.y,
      z: depth,
    }),
  );
