import { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/**
 * Apply one TRS transform to a point: scale per axis, then rotate, then
 * translate, the order a renderer applies a node's transform in.
 *
 * Exported because the same arithmetic places a model's parts for measurement
 * in `computeModelRestExtent` and carries a measured model box out into the
 * world a camera frames it in through {@link nodeSubjectBox}. A second copy is
 * how the box a shot is graded against comes to disagree with the box it was
 * solved from. The rotation is used as given, so a non-unit quaternion distorts
 * the point rather than rotating it.
 *
 * @param transform The transform to apply.
 * @param point The point in the transform's local frame.
 * @returns A new point in the parent frame.
 */
export function placeTransformedPoint(
  transform: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    transform.translation,
    Quaternion.rotateVector(transform.rotation, {
      x: point.x * transform.scale.x,
      y: point.y * transform.scale.y,
      z: point.z * transform.scale.z,
    }),
  );
}
