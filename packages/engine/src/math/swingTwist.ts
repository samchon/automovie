import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

/**
 * Split a rotation into a twist about a given axis and the swing that is
 * left, `q = swing * twist`, the swing-twist decomposition.
 *
 * The twist is the rotation's vector part projected on the axis together with
 * its scalar part, renormalised (Dobrowolski 2015, "Swing-twist decomposition
 * in Clifford algebra", arXiv:1506.05481), and the swing is `q * twist^-1`, a
 * rotation whose axis is perpendicular to the given one. When the rotation is
 * a half turn about an axis perpendicular to the given one, the projection
 * vanishes and the twist is undefined; this returns the identity twist and
 * the whole rotation as swing, the convention the joint code relies on, since
 * any twist then gives the same swing magnitude.
 *
 * @param rotation A unit quaternion.
 * @param axis The twist axis, in the same frame as the rotation; need not be unit length.
 * @returns The swing and the twist, unit quaternions with `rotation = swing * twist`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the factor order, the method and its source, and the degenerate half-turn case with the value returned.
 * @evidence contracts/development/implementation.md#principled-implementation The projection form of the swing-twist decomposition (Dobrowolski 2015); the 1e-12 threshold only detects the exact degeneracy where the projected quaternion has no length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of swing-twist in the engine: `splitDistalTwist` and the hinged-chain candidate's effector error both call it instead of projecting inline.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The degenerate case returns a documented convention rather than a tuned fallback; no tolerance changes a non-degenerate result.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one projection, one normalisation and one quaternion product.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two small values; there is nothing to share.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two fresh quaternions and keeps nothing.
 */
export function swingTwist(
  rotation: IAutoMovieQuaternion,
  axis: IAutoMovieVector3,
): { swing: IAutoMovieQuaternion; twist: IAutoMovieQuaternion } {
  const unit: IAutoMovieVector3 = Vector3.normalize(axis);
  const along: number =
    rotation.x * unit.x + rotation.y * unit.y + rotation.z * unit.z;
  const length: number = Math.hypot(along, rotation.w);
  // A half turn about a perpendicular axis projects to nothing: no twist is defined.
  if (length < 1e-12)
    return { swing: { ...rotation }, twist: Quaternion.identity() };
  const twist: IAutoMovieQuaternion = {
    x: (unit.x * along) / length,
    y: (unit.y * along) / length,
    z: (unit.z * along) / length,
    w: rotation.w / length,
  };
  return {
    swing: Quaternion.normalize(
      Quaternion.multiply(rotation, Quaternion.inverse(twist)),
    ),
    twist,
  };
}
