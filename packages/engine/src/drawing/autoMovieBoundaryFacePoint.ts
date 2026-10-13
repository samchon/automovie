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
