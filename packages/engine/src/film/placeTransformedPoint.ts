import { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Apply one TRS transform to a point, scale first, as a renderer does.
 *
 * Exported because the same arithmetic places a model's parts for measurement
 * and carries a measured model box out into the world a camera frames it in. A
 * second copy is how the box a shot is graded against comes to disagree with
 * the box it was solved from.
 */
export const placeTransformedPoint = (
  transform: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.add(
    transform.translation,
    Quaternion.rotateVector(transform.rotation, {
      x: point.x * transform.scale.x,
      y: point.y * transform.scale.y,
      z: point.z * transform.scale.z,
    }),
  );
