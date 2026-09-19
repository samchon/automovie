import { IAutoMovieBoundaryFace, IAutoMoviePlanarPoint, IAutoMovieVector3 } from "@automovie/interface";
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
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Places boundary-local drawing coordinates on the actual sloped or rotated face instead of flattening them into an assumed world plane.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Rotates a planar point through the face frame, advances it by the requested local depth, and translates it to the face origin.
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
