import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** A share of the shortest turn taking one direction onto another. */
export function HumanMountPushTurned(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  share: number,
): IAutoMovieQuaternion {
  const a: IAutoMovieVector3 = Vector3.normalize(from);
  const b: IAutoMovieVector3 = Vector3.normalize(to);
  const axis: IAutoMovieVector3 = Vector3.cross(a, b);
  const sine: number = Vector3.length(axis);
  if (sine < 1e-9) return Quaternion.identity();
  return Quaternion.fromAxisAngle(
    Vector3.scale(axis, 1 / sine),
    (share * Math.atan2(sine, Vector3.dot(a, b))) / Quaternion.DEG2RAD,
  );
}
