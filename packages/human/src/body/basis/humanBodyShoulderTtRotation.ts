import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

const DOWN: IAutoMovieVector3 = Vector3.create(0, -1, 0);

/**
 * Direct tilt into the selected plane, followed by independent rotation about the resulting humeral axis. There is no initial long-axis turn, unlike YXY.
 *
 * Angles are degrees under the admitted side-specific TT convention. This is an orientation conversion; reach and clinical admission belong to the caller.
 *
 * @evidence contracts/common.md#principled-implementation A side-aware tilt axis rotates the hanging -Y humerus into its selected plane/elevation, then signed axial torsion rotates about that resulting axis before quaternion normalization.
 * @evidence contracts/common.md#clear-and-simple-design Tilt and torsion remain two explicit engine quaternion operations, preserving the TT convention rather than introducing an initial YXY axis turn.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degree angles and selected side come from an admitted pose; conversion performs no clinical reach clamping or anatomical fit and normalization addresses representation alone.
 * @evidence contracts/common.md#meaningful-documentation The comment gives direct tilt then independent axial turn, degree units, hanging direction and the caller's admission responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed axis-angle constructions, one vector rotation, quaternion multiplication and normalization require constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared engine vector/quaternion primitives serve rig posing and orientation-distance consumers; the fixed hanging vector is reused without a pose cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fixed three-scalar DOWN vector is module-owned, while temporary axes/quaternions expire and only the returned orientation escapes; no geometry or external work is retained.
 */
export function humanBodyShoulderTtRotation(
  pose: IAutoMovieHumanBodyShoulderPose,
): IAutoMovieQuaternion {
  const side: number = pose.bone === "leftUpperArm" ? 1 : -1;
  const plane: number = pose.plane * Quaternion.DEG2RAD;
  const tiltAxis: IAutoMovieVector3 = Vector3.create(
    -Math.sin(plane),
    0,
    side * Math.cos(plane),
  );
  const tilt: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    tiltAxis,
    pose.elevation,
  );
  const humeralAxis: IAutoMovieVector3 = Quaternion.rotateVector(tilt, DOWN);
  const torsion: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    humeralAxis,
    -side * pose.axialRotation,
  );
  return Quaternion.normalize(Quaternion.multiply(torsion, tilt));
}
