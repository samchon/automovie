import {
  type IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import type { IAutoMovieJointRotationDomain } from "./IAutoMovieJointRotationDomain";
import type { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointRomOvershoot } from "./jointRomOvershoot";
import { normalizeJointAxes } from "./normalizeJointAxes";

const RAD2DEG: number = 180 / Math.PI;

const QUATERNION_AXES: readonly ["x", "y", "z", "w"] = ["x", "y", "z", "w"];

/**
 * Cosine-sine bound past which the middle angle of the extraction counts as
 * ±90 degrees, within about 0.08 degrees, and the gimbal branch pins one angle.
 */
const GIMBAL_BOUND: number = 0.999999;

/** Choose an admitted full-turn alias when one exists; never clamp an angle. */
const periodicAngle = (
  angle: number,
  range: IAutoMovieAngleRange | null,
): number => {
  const minimum: number = range?.min ?? 0;
  const maximum: number = range?.max ?? 0;
  if (angle >= minimum && angle <= maximum) return angle;
  const first: number = Math.ceil((minimum - angle) / 360);
  const last: number = Math.floor((maximum - angle) / 360);
  return first > last
    ? angle
    : angle + 360 * Math.max(first, Math.min(last, 0));
};

const assertFiniteQuaternion = (q: IAutoMovieQuaternion): void => {
  for (const axis of QUATERNION_AXES) {
    const value: number = q[axis];
    if (!Number.isFinite(value))
      throw new Error(
        `decomposeJointRotation quaternion.${axis} must be finite, but was ${value}`,
      );
  }
};

/**
 * Recover a joint's flexion, abduction and twist, in degrees, from its
 * bone-local rotation: the inverse of {@link jointToQuaternion} for the same
 * `axes` and `frame`. IK solvers compute quaternions and lower them through
 * this into the angles a pose carries.
 *
 * Changing basis by `M = [flexion | abduction | twist]` turns a proximal
 * twist's `qTwist · qAbduction · qFlexion` into `Rz·Ry·Rx` and a distal twist's
 * `qAbduction · qFlexion · qTwist` into `Ry·Rx·Rz`, which are read in closed
 * form from dot products of the axes with the rotated axes. At the gimbal
 * (abduction ±90 for a proximal twist, flexion ±90 for a distal one) only one
 * combination of the outer angles is determined, so the other outer angle is
 * pinned to 0 and twist takes the rest; the angles still rebuild the rotation.
 * A left-handed basis, such as the default (`flexion × abduction = −twist`),
 * is extracted against `−twist` and the twist sign restored, so the round trip
 * holds for any orthonormal basis.
 *
 * `frame` lifts the rest-relative angles to clinical ones,
 * `clinical = sign · r + neutral`. A `domain` with a non-null constraint also
 * considers the rotation's second Euler chart, `(f + 180, 180 − a, t + 180)`
 * for a proximal twist and `(180 − f, a + 180, t + 180)` for a distal one, and
 * full-turn aliases of each that fall inside the constraint's ranges. The
 * candidate with the least {@link jointRomOvershoot} wins, the principal chart
 * on a tie. Every candidate is the same rotation, so a pose no chart can hold
 * keeps its overshoot instead of being clamped.
 *
 * Throws on a non-finite quaternion component or an invalid axis basis (see
 * {@link normalizeJointAxes}). A non-unit quaternion is read as its rotation
 * matrix, which is only a rotation for a unit quaternion.
 *
 * @param q Bone-local articulation rotation; unit length expected.
 * @param axes Clinical axis basis; defaults to `DEFAULT_JOINT_AXES`.
 * @param frame Rest frame lifting rest-relative angles to clinical ones;
 *   omitted, the angles stay rest-relative.
 * @param domain Bone and resolved ROM that choose among equivalent charts;
 *   omitted or with a `null` constraint, the principal chart is returned.
 *
 * @evidence contracts/common.md#principled-implementation Closed-form Euler extraction in the joint's own basis, `R'ᵢⱼ = axisᵢ · (q axisⱼ)`, with `asin` arguments clamped to [-1, 1] against rounding and a gimbal branch past `GIMBAL_BOUND`; it premises an orthonormal basis, which `normalizeJointAxes` enforces, and a unit quaternion, which is the caller's stated input; chart selection relies on the identity that both Euler charts and every 360-degree alias describe one rotation, so choosing among them never changes the pose.
 * @evidence contracts/common.md#clear-and-simple-design The extraction, the handedness correction, the clinical lift and the ROM chart choice sit in one inverse because each depends on the others' convention; ROM scoring is delegated to `jointRomOvershoot` and frame arithmetic to `toClinicalAngle`, so the gate and this inverse read one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair, not a compensation, and no bone is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the inverse relationship, both composition orders, the gimbal convention, the handedness correction, the frame lift, both alternate charts and the tie rule, the thrown inputs, the unit-quaternion premise, and each parameter's default.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one basis validation, three vector rotations and at most a dozen dot products, plus, with a domain, three ROM scorings; no matrix is built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one rotation that coordinates no work across calls; the arm solve calls it per candidate with a different rotation each time.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned angles.
 * @author Samchon
 */
export const decomposeJointRotation = (
  q: IAutoMovieQuaternion,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
  domain?: IAutoMovieJointRotationDomain,
): IAutoMovieResolvedJointAngles => {
  assertFiniteQuaternion(q);
  const basis: IAutoMovieJointAxes = normalizeJointAxes(
    axes,
    "decomposeJointRotation axes",
  );

  // Lift a rig-relative extraction into clinical angles (the inverse of
  // jointToQuaternion's `frame` map); the identity when no frame is given.
  const clinical = (
    rig: IAutoMovieResolvedJointAngles,
  ): IAutoMovieResolvedJointAngles => ({
    // toClinicalAngle only returns null for a null input; these are numbers.
    flexion: toClinicalAngle(rig.flexion, frame?.flexion)!,
    abduction: toClinicalAngle(rig.abduction, frame?.abduction)!,
    twist: toClinicalAngle(rig.twist, frame?.twist)!,
  });
  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const handed: number =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const twistAxis: IAutoMovieVector3 = Vector3.scale(basis.twist, handed);
  const lift = (
    rig: IAutoMovieResolvedJointAngles,
  ): IAutoMovieResolvedJointAngles => {
    const principal: IAutoMovieResolvedJointAngles = clinical(rig);
    if (domain === undefined || domain.constraint === null) return principal;
    const constraint: IAutoMovieJointConstraint = domain.constraint;
    const align = (
      candidate: IAutoMovieResolvedJointAngles,
    ): IAutoMovieResolvedJointAngles => ({
      flexion: periodicAngle(candidate.flexion, constraint.flexion),
      abduction: periodicAngle(candidate.abduction, constraint.abduction),
      twist: periodicAngle(candidate.twist, constraint.twist),
    });
    const alternate: IAutoMovieResolvedJointAngles = clinical({
      flexion:
        basis.twistPlacement === "distal"
          ? 180 - rig.flexion
          : rig.flexion + 180,
      abduction:
        basis.twistPlacement === "distal"
          ? rig.abduction + 180
          : 180 - rig.abduction,
      twist: rig.twist + 180 * handed,
    });
    let selected: IAutoMovieResolvedJointAngles = principal;
    let overshoot: number = jointRomOvershoot(
      { bone: domain.bone, ...selected },
      constraint,
    );
    for (const candidate of [align(principal), align(alternate)]) {
      const next: number = jointRomOvershoot(
        { bone: domain.bone, ...candidate },
        constraint,
      );
      if (next < overshoot) {
        selected = candidate;
        overshoot = next;
      }
    }
    return selected;
  };

  const Rf: IAutoMovieVector3 = Quaternion.rotateVector(q, basis.flexion);
  const Ra: IAutoMovieVector3 = Quaternion.rotateVector(q, basis.abduction);
  const Rt: IAutoMovieVector3 = Quaternion.rotateVector(q, twistAxis);

  // Entries of R' = Mᵀ R M (M = [flex|abd|twist]): R'[i][j] = axisᵢ · (R axisⱼ).
  if (basis.twistPlacement === "distal") {
    // R = Ry(a)·Rx(f)·Rz(t): R12 = −sin f, R02 = sin a cos f, R22 = cos a cos f,
    // R10 = cos f sin t, R11 = cos f cos t (row i: basis axis i, column j:
    // basis axis j rotated)
    const r12: number = Vector3.dot(basis.abduction, Rt);
    if (r12 < -GIMBAL_BOUND || r12 > GIMBAL_BOUND) {
      // with abduction pinned to 0, R = Rx(±90°)·Rz(t): R00 = cos t, R01 = −sin t
      const r00: number = Vector3.dot(basis.flexion, Rf);
      const r01: number = Vector3.dot(basis.flexion, Ra);
      return lift({
        flexion: r12 < 0 ? 90 : -90,
        abduction: 0,
        twist: handed * Math.atan2(-r01, r00) * RAD2DEG,
      });
    }
    return lift({
      flexion: Math.asin(Math.max(-1, Math.min(1, -r12))) * RAD2DEG,
      abduction:
        Math.atan2(Vector3.dot(basis.flexion, Rt), Vector3.dot(twistAxis, Rt)) *
        RAD2DEG,
      twist:
        handed *
        Math.atan2(
          Vector3.dot(basis.abduction, Rf),
          Vector3.dot(basis.abduction, Ra),
        ) *
        RAD2DEG,
    });
  }

  const m00: number = Vector3.dot(basis.flexion, Rf);
  const m10: number = Vector3.dot(basis.abduction, Rf);
  const m20: number = Vector3.dot(twistAxis, Rf);
  const m21: number = Vector3.dot(twistAxis, Ra);
  const m22: number = Vector3.dot(twistAxis, Rt);

  if (m20 < -GIMBAL_BOUND || m20 > GIMBAL_BOUND) {
    // Gimbal: abduction = ±90°, flexion folds into twist. Pin flexion = 0.
    const m01: number = Vector3.dot(basis.flexion, Ra);
    const m11: number = Vector3.dot(basis.abduction, Ra);
    // Both gimbals leave only (twist ± flexion) determined; with flexion pinned
    // to 0, twist = −atan2(R'[0][1], R'[1][1]) reconstructs the rotation.
    const abduction: number = m20 < 0 ? 90 : -90;
    const twist: number = -Math.atan2(m01, m11) * RAD2DEG;
    return lift({ flexion: 0, abduction, twist: handed * twist });
  }

  return lift({
    flexion: Math.atan2(m21, m22) * RAD2DEG,
    abduction: Math.asin(Math.max(-1, Math.min(1, -m20))) * RAD2DEG,
    twist: handed * Math.atan2(m10, m00) * RAD2DEG,
  });
};
