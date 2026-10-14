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
 * heading. `depth` walks along the face's local +Z axis, the authored outward
 * normal, which is how the two faces of a separation of stated thickness are
 * reached: the boundary shell places its caps at depth 0 and at the face
 * thickness. Validation does not check that +Z really points out of the space.
 *
 * The result is `origin + rotation * (x, y, depth)` in world metres: `point`
 * lies in the face's local XY plane and a negative `depth` moves along local
 * -Z. `face.rotation` is used as given and must be a unit quaternion, which
 * `validateBuiltEnvironment` requires; a non-unit one would scale the offset.
 *
 * @param face Boundary face whose rigid frame places the point.
 * @param point Point in the face's planar outline frame, in metres.
 * @param depth Offset along the face's local +Z axis in metres, default 0.
 * @returns World position in metres.
 *
 * @evidence contracts/common.md#principled-implementation A rigid transform, rotation by the face quaternion followed by translation to its origin, maps face-local coordinates to world exactly; the unit-quaternion premise holds because building validation refuses a face rotation off unit norm by more than 1e-6.
 * @evidence contracts/common.md#clear-and-simple-design One face-to-world placement shared by the boundary shell triangulation and the opening marks, so a drafted wall and the void drawn on it are placed by the same frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face orientation is special-cased or flattened to a heading; the rotation is applied as stated.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the formula, the local plane and depth axis and that its outward sense is unchecked, the units, how the shell uses depth, the unit-quaternion premise, and the effect of breaking it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, one quaternion rotation and one addition, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure per-point map that coordinates no work across calls; callers place each outline point once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the local offset and the returned point, and retains nothing.
 */
export const autoMovieBoundaryFacePoint: (
  face: IAutoMovieBoundaryFace,
  point: IAutoMoviePlanarPoint,
  depth?: number,
) => IAutoMovieVector3 = (
  face: IAutoMovieBoundaryFace,
  point: IAutoMoviePlanarPoint,
  depth: number = 0,
): IAutoMovieVector3 =>
  Vector3.add(
    face.origin,
    Quaternion.rotateVector(face.rotation, {
      x: point.x,
      y: point.y,
      z: depth,
    }),
  );
