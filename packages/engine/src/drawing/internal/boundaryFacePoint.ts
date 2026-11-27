import {
  IAutoMovieBoundaryFace,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
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
 * Parameter face: Boundary face whose rigid frame places the point.
 * Parameter point: Point in the face's planar outline frame, in metres.
 * Parameter depth: Offset along the face's local +Z axis in metres, default 0.
 * Returns: World position in metres.
 */
export const boundaryFacePoint: (
  face: IAutoMovieBoundaryFace,
  point: IAutoMoviePlanarPoint,
  depth?: number,
) => IAutoMovieVector3 = (
  face: IAutoMovieBoundaryFace,
  point: IAutoMoviePlanarPoint,
  depth: number = 0,
): IAutoMovieVector3 =>
  AutoMovieEngineVector3.add(
    face.origin,
    AutoMovieEngineQuaternion.rotateVector(face.rotation, {
      x: point.x,
      y: point.y,
      z: depth,
    }),
  );
