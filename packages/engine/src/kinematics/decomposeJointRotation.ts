import { IAutoMovieQuaternion } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "./normalizeJointAxes";

const RAD2DEG = 180 / Math.PI;
const QUATERNION_AXES = ["x", "y", "z", "w"] as const;

const assertFiniteQuaternion = (q: IAutoMovieQuaternion): void => {
  for (const axis of QUATERNION_AXES) {
    const value = q[axis];
    if (!Number.isFinite(value))
      throw new Error(
        `decomposeJointRotation quaternion.${axis} must be finite, but was ${value}`,
      );
  }
};

/**
 * The inverse of {@link jointToQuaternion}: recover the clinical angles (flexion
 * / abduction / twist, degrees) from a bone-local rotation, given the same axis
 * basis. This is what an IK solver needs. It computes the bone rotations that
 * reach a goal as quaternions, then lowers them back into the
 * flexion/abduction/twist a pose carries.
 *
 * The extraction diagonalises the composition the axes declare
 * ({@link IAutoMovieJointAxes.twistPlacement}). Changing basis by `M =
 * [flexAxis | abdAxis | twistAxis]` turns a proximal twist's `q = qTwist ·
 * qAbduction · qFlexion` into the standard `Rz(twist)·Ry(abduction)·Rx(flexion)`
 * sequence (a ZYX extraction) and a distal twist's `q = qAbduction · qFlexion ·
 * qTwist` into `Ry(abduction)·Rx(flexion)·Rz(twist)` (a YXZ extraction). Both
 * closed forms are computed as dot products of the axes with the rotated axes,
 * so no matrix is built. Gimbal lock collapses two angles into one: for a
 * proximal twist at abduction ≈ ±90° the extraction pins flexion to 0, and for
 * a distal twist at flexion ≈ ±90° it pins abduction to 0, folding the freedom
 * into twist; either still reconstructs the same rotation.
 *
 * A **left-handed** axis triple (the default clinical basis is one: `flexAxis ×
 * abdAxis = −twistAxis`) would flip the twist sense; the extraction detects the
 * handedness and corrects it, so `jointToQuaternion(decompose(q))` round-trips
 * for any orthonormal basis, right- or left-handed.
 *
 * A `frame` ({@link IAutoMovieRestFrame}) lifts the recovered rest-relative
 * angles into **clinical** ones (`clinical = sign · r + neutral`), the inverse
 * of `jointToQuaternion`'s `frame` map, so `jointToQuaternion(decompose(q,
 * axes, f), axes, f)` still round-trips.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Recovers the rig-basis semantic controls encoded by a solved quaternion.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Converts a solved quaternion back into the semantic controls consumed by the ROM graph.
 * @author Samchon
 */
export const decomposeJointRotation = (
  q: IAutoMovieQuaternion,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
): { flexion: number; abduction: number; twist: number } => {
  assertFiniteQuaternion(q);
  const basis = normalizeJointAxes(axes, "decomposeJointRotation axes");

  // Lift a rig-relative extraction into clinical angles (the inverse of
  // jointToQuaternion's `frame` map); the identity when no frame is given.
  const lift = (rig: {
    flexion: number;
    abduction: number;
    twist: number;
  }): { flexion: number; abduction: number; twist: number } => ({
    // toClinicalAngle only returns null for a null input; these are numbers.
    flexion: toClinicalAngle(rig.flexion, frame?.flexion)!,
    abduction: toClinicalAngle(rig.abduction, frame?.abduction)!,
    twist: toClinicalAngle(rig.twist, frame?.twist)!,
  });
  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const handed =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const twistAxis = Vector3.scale(basis.twist, handed);

  const Rf = Quaternion.rotateVector(q, basis.flexion);
  const Ra = Quaternion.rotateVector(q, basis.abduction);
  const Rt = Quaternion.rotateVector(q, twistAxis);

  // Entries of R' = Mᵀ R M (M = [flex|abd|twist]): R'[i][j] = axisᵢ · (R axisⱼ).
  if (basis.twistPlacement === "distal") {
    // R = Ry(a)·Rx(f)·Rz(t): R12 = −sin f, R02 = sin a cos f, R22 = cos a cos f,
    // R10 = cos f sin t, R11 = cos f cos t (row i: basis axis i, column j:
    // basis axis j rotated)
    const r12 = Vector3.dot(basis.abduction, Rt);
    if (r12 < -0.999999 || r12 > 0.999999) {
      // with abduction pinned to 0, R = Rx(±90°)·Rz(t): R00 = cos t, R01 = −sin t
      const r00 = Vector3.dot(basis.flexion, Rf);
      const r01 = Vector3.dot(basis.flexion, Ra);
      return lift({ flexion: r12 < 0 ? 90 : -90, abduction: 0, twist: handed * Math.atan2(-r01, r00) * RAD2DEG });
    }
    return lift({
      flexion: Math.asin(Math.max(-1, Math.min(1, -r12))) * RAD2DEG,
      abduction: Math.atan2(Vector3.dot(basis.flexion, Rt), Vector3.dot(twistAxis, Rt)) * RAD2DEG,
      twist: handed * Math.atan2(Vector3.dot(basis.abduction, Rf), Vector3.dot(basis.abduction, Ra)) * RAD2DEG,
    });
  }

  const m00 = Vector3.dot(basis.flexion, Rf);
  const m10 = Vector3.dot(basis.abduction, Rf);
  const m20 = Vector3.dot(twistAxis, Rf);
  const m21 = Vector3.dot(twistAxis, Ra);
  const m22 = Vector3.dot(twistAxis, Rt);

  if (m20 < -0.999999 || m20 > 0.999999) {
    // Gimbal: abduction = ±90°, flexion folds into twist. Pin flexion = 0.
    const m01 = Vector3.dot(basis.flexion, Ra);
    const m11 = Vector3.dot(basis.abduction, Ra);
    // Both gimbals leave only (twist ± flexion) determined; with flexion pinned
    // to 0, twist = −atan2(R'[0][1], R'[1][1]) reconstructs the rotation.
    const abduction = m20 < 0 ? 90 : -90;
    const twist = -Math.atan2(m01, m11) * RAD2DEG;
    return lift({ flexion: 0, abduction, twist: handed * twist });
  }

  return lift({
    flexion: Math.atan2(m21, m22) * RAD2DEG,
    abduction: Math.asin(Math.max(-1, Math.min(1, -m20))) * RAD2DEG,
    twist: handed * Math.atan2(m10, m00) * RAD2DEG,
  });
};
