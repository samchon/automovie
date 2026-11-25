import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The least rotation that turns one unit direction onto another: about their
 * cross product by the angle between them, the identity when they already
 * agree. A held outlet is aimed by it, as an extinguisher's horn or a hose's
 * nozzle turns onto a fire.
 *
 * @param from The direction turned, unit.
 * @param to The direction it is turned onto, unit.
 * @returns The rotation.
 */
export function rotationBetween(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const axis: IAutoMovieVector3 = Vector3.cross(from, to);
  const sine: number = Vector3.length(axis);
  if (sine < 1e-9) return Quaternion.identity();
  return Quaternion.fromAxisAngle(
    Vector3.scale(axis, 1 / sine),
    (Math.atan2(sine, Vector3.dot(from, to)) * 180) / Math.PI,
  );
}
