import {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { IAutoMovieJointRotationDomain } from "./IAutoMovieJointRotationDomain";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { jointRomOvershoot } from "./jointRomOvershoot";

const RAD2DEG: number = 180 / Math.PI;

const QUATERNION_AXES: readonly ["x", "y", "z", "w"] = ["x", "y", "z", "w"];

/**
 * Projected cosine at or below which the gimbal convention pins one outer
 * angle: the square root of the binary64 unit roundoff, about 1.5e-8.
 *
 * With a projected cosine `c`, the two outer angles are read from matrix
 * entries of size `c` that carry a rounding error of about one unit roundoff
 * `e`, so each is uncertain by about `e / c` radians; pinning one of them to
 * zero instead rebuilds the rotation within `c` times the pinned angle. The
 * two errors meet at `c = sqrt(e)`, the usual balance of a rounding against a
 * truncation error, where both are near 1e-8 radian. A narrower band leaves
 * turns whose outer angles are rounding noise, tens of degrees at `c` near
 * 1e-15, which a caller that holds one of the two (a hinge's immobile
 * abduction clamped to zero) then shows as a rotation error of that size: an
 * elbow held at a right angle read a different forearm twist every call.
 * Resolvable near-gimbal turns, from about a millionth of a degree off the
 * right angle, stay active.
 */
const GIMBAL_COSINE_EPSILON: number = Math.sqrt(Number.EPSILON);

/**
 * Choose the full-turn alias of an angle nearest its admitted range: one
 * inside the range when any is, otherwise the alias with the least overshoot
 * (the lower one on a tie); never clamp an angle.
 *
 * The nearest alias matters for a range no alias can hit exactly. An immobile
 * axis admits only 0, and an extraction returns its half turn as 180 degrees
 * less a rounding error, so the alternate chart's 360 degrees less that error
 * has no alias at exactly 0; left unaliased it would score a full turn of
 * overshoot and lose the chart choice to a far worse chart, on rounding
 * noise alone.
 */
const periodicAngle: (
  angle: number,
  range: IAutoMovieAngleRange | null,
) => number = (angle: number, range: IAutoMovieAngleRange | null): number => {
  const minimum: number = range?.min ?? 0;
  const maximum: number = range?.max ?? 0;
  if (angle >= minimum && angle <= maximum) return angle;
  const first: number = Math.ceil((minimum - angle) / 360);
  const last: number = Math.floor((maximum - angle) / 360);
  if (first <= last) return angle + 360 * Math.max(first, Math.min(last, 0));
  // No alias is inside: `last` is the nearest one below the range and `first`
  // the nearest one above it.
  const below: number = angle + 360 * last;
  const above: number = angle + 360 * first;
  return minimum - below <= above - maximum ? below : above;
};

const assertFiniteQuaternion: (q: IAutoMovieQuaternion) => void = (
  q: IAutoMovieQuaternion,
): void => {
  for (const axis of QUATERNION_AXES) {
    const value: number = q[axis];
    if (!Number.isFinite(value))
      throw new Error(
        `decomposeJointRotation quaternion.${axis} must be finite, but was ${value}`,
      );
  }
};

/**
 * {@link decomposeJointRotation} on a basis its caller already admitted and
 * normalized through {@link normalizeJointAxes}: the extraction itself, with
 * no validation of the basis.
 *
 * A solver that decomposes hundreds of candidate rotations of one joint
 * normalizes that joint's basis once and calls this for each candidate, so
 * the basis is checked once per solve rather than once per candidate. The
 * angles, the gimbal convention, the handedness correction, the frame lift
 * and the chart choice are `decomposeJointRotation`'s, which documents them
 * and is this function behind one normalization.
 *
 * Throws on a non-finite quaternion component. A basis that is not
 * orthonormal gives angles that do not rebuild the rotation; nothing here
 * detects it.
 *
 * @param q Bone-local articulation rotation; unit length expected.
 * @param basis Orthonormal clinical axis basis, as `normalizeJointAxes` returns it.
 * @param frame Rest frame lifting rest-relative angles to clinical ones;
 *   omitted, the angles stay rest-relative.
 * @param domain Bone and resolved ROM that choose among equivalent charts;
 *   omitted or with a `null` constraint, the principal chart is returned.
 */
export const decomposeJointRotationOnBasis: (
  q: IAutoMovieQuaternion,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
  domain?: IAutoMovieJointRotationDomain | undefined,
) => IAutoMovieResolvedJointAngles = (
  q: IAutoMovieQuaternion,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  domain?: IAutoMovieJointRotationDomain,
): IAutoMovieResolvedJointAngles => {
  assertFiniteQuaternion(q);

  // Lift a rig-relative extraction into clinical angles (the inverse of
  // jointToQuaternion's `frame` map); the identity when no frame is given.
  const clinical: (
    rig: IAutoMovieResolvedJointAngles,
  ) => IAutoMovieResolvedJointAngles = (
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
  const lift: (
    rig: IAutoMovieResolvedJointAngles,
  ) => IAutoMovieResolvedJointAngles = (
    rig: IAutoMovieResolvedJointAngles,
  ): IAutoMovieResolvedJointAngles => {
    const principal: IAutoMovieResolvedJointAngles = clinical(rig);
    if (domain === undefined || domain.constraint === null) return principal;
    const constraint: IAutoMovieJointConstraint = domain.constraint;
    const align: (
      candidate: IAutoMovieResolvedJointAngles,
    ) => IAutoMovieResolvedJointAngles = (
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
    const r10: number = Vector3.dot(basis.abduction, Rf);
    const r11: number = Vector3.dot(basis.abduction, Ra);
    const cosine: number = Math.hypot(r10, r11);
    if (cosine <= GIMBAL_COSINE_EPSILON) {
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
      flexion: Math.atan2(-r12, cosine) * RAD2DEG,
      abduction:
        Math.atan2(Vector3.dot(basis.flexion, Rt), Vector3.dot(twistAxis, Rt)) *
        RAD2DEG,
      twist: handed * Math.atan2(r10, r11) * RAD2DEG,
    });
  }

  const m00: number = Vector3.dot(basis.flexion, Rf);
  const m10: number = Vector3.dot(basis.abduction, Rf);
  const m20: number = Vector3.dot(twistAxis, Rf);
  const m21: number = Vector3.dot(twistAxis, Ra);
  const m22: number = Vector3.dot(twistAxis, Rt);

  const cosine: number = Math.hypot(m00, m10);
  if (cosine <= GIMBAL_COSINE_EPSILON) {
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
    abduction: Math.atan2(-m20, cosine) * RAD2DEG,
    twist: handed * Math.atan2(m10, m00) * RAD2DEG,
  });
};
