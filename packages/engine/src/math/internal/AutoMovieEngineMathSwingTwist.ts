import type {
  IAutoMovieQuaternion,
  IAutoMovieSwingTwistResult,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../Quaternion";
import { Vector3 } from "../Vector3";

/*
 * Quaternion swing and twist decomposition operations.
 */
export namespace AutoMovieEngineMathSwingTwist {
/*
 * Split a rotation into a twist about a given axis and the swing that is left,
 * `q = swing * twist`, the swing-twist decomposition.
 *
 * The twist is the rotation's vector part projected on the axis together with
 * its scalar part, renormalised (Dobrowolski 2015, "Swing-twist decomposition
 * in Clifford algebra", arXiv:1506.05481), and the swing is `q * twist^-1`, a
 * rotation whose axis is perpendicular to the given one. When the rotation is a
 * half turn about an axis perpendicular to the given one, the projection
 * vanishes and the twist is undefined; this returns the identity twist and the
 * whole rotation as swing, the convention the joint code relies on, since any
 * twist then gives the same swing magnitude.
 * Parameter rotation: A unit quaternion.
 * Parameter axis: The twist axis, in the same frame as the rotation; need not be
 * unit length.
 * Returns: The swing and the twist, unit quaternions with `rotation = swing *
 * twist`.
 */
export function swingTwist(
  rotation: IAutoMovieQuaternion,
  axis: IAutoMovieVector3,
): IAutoMovieSwingTwistResult {
  const twist: IAutoMovieQuaternion | null = swingTwistComponent(rotation, axis);
  // A half turn about a perpendicular axis projects to nothing: no twist is defined.
  if (twist === null)
    return { swing: { ...rotation }, twist: Quaternion.identity() };
  return {
    swing: Quaternion.normalize(
      Quaternion.multiply(rotation, Quaternion.inverse(twist)),
    ),
    twist,
  };
}

/*
 * Compute the twist component alone.
 */

/*
 * The twist of `swingTwist` alone, for a reader that discards the swing (a
 * swing-twist range reads the swing from where the axis goes): the same
 * projection and renormalisation, or null where the projection vanishes and
 * `swingTwist` returns the identity twist.
 * Parameter rotation: A unit quaternion.
 * Parameter axis: The twist axis; need not be unit length.
 * Returns: The twist, or null where it is undefined.
 */
export function swingTwistComponent(
  rotation: IAutoMovieQuaternion,
  axis: IAutoMovieVector3,
): IAutoMovieQuaternion | null {
  const unit: IAutoMovieVector3 = Vector3.normalize(axis);
  const along: number =
    rotation.x * unit.x + rotation.y * unit.y + rotation.z * unit.z;
  const length: number = Math.hypot(along, rotation.w);
  if (length < 1e-12) return null;
  return {
    x: (unit.x * along) / length,
    y: (unit.y * along) / length,
    z: (unit.z * along) / length,
    w: rotation.w / length,
  };
}


}
