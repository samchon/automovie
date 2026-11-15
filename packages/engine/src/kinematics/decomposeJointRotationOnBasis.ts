import {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { IAutoMovieJointRotationDomain } from "./IAutoMovieJointRotationDomain";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { alternateRigJointAngles } from "./alternateRigJointAngles";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the caller must have done to the basis, why the split exists, that the conventions are `decomposeJointRotation`'s, what is thrown and what an unnormalized basis silently gives.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form Euler extraction reads each angle's sine and projected cosine through atan2; a projected cosine within the square root of the binary64 unit roundoff, where a rounding error and the pin's truncation error meet, takes the undetermined-angle convention. Among the principal chart, the alternate chart and each angle's full-turn alias nearest its range, the least ROM overshoot wins, and every candidate is the same rotation. A constraint's `swingTwist` is set aside while the readings are ranked, since both readings of one rotation lie equally inside such a gate; the three-angle box ranks them, so the reading a pose reports stays the one it always was.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The extraction, the handedness correction, the clinical lift and the chart choice sit in one inverse because each depends on the others' convention; ROM scoring is delegated to `jointRomOvershoot`, the alias to `nearestAngleAlias` and frame arithmetic to `toClinicalAngle`, and `decomposeJointRotation` is this function behind one normalization.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair, and no bone is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three vector rotations, a few dot products and at most three overshoot scores in constant time, an alias that leaves the selected reading unchanged not scored again; taking the basis already normalized removes one validation and normalization from each of the hundreds of candidates a limb fit decomposes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller normalizes a joint's basis once per solve and passes it to every call, which is the reason this entry exists beside `decomposeJointRotation`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the angles are a new record.
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
  const { handed, twistAxis }: IHandedness = handednessOf(basis);
  const lift: (
    rig: IAutoMovieResolvedJointAngles,
  ) => IAutoMovieResolvedJointAngles = (
    rig: IAutoMovieResolvedJointAngles,
  ): IAutoMovieResolvedJointAngles => {
    const principal: IAutoMovieResolvedJointAngles = clinical(rig);
    if (domain === undefined || domain.constraint === null) return principal;
    // The two readings are ranked by the three-angle box even for a joint
    // gated by swing and twist, under which both readings of one rotation are
    // equally inside: the choice is of a reading, the one a pose reports in,
    // and stays the one it always was.
    const constraint: IAutoMovieJointConstraint = boxOf(domain.constraint);
    const align: (
      candidate: IAutoMovieResolvedJointAngles,
    ) => IAutoMovieResolvedJointAngles = (
      candidate: IAutoMovieResolvedJointAngles,
    ): IAutoMovieResolvedJointAngles => ({
      flexion: nearestAngleAlias(candidate.flexion, constraint.flexion),
      abduction: nearestAngleAlias(candidate.abduction, constraint.abduction),
      twist: nearestAngleAlias(candidate.twist, constraint.twist),
    });
    const alternate: IAutoMovieResolvedJointAngles = clinical(
      alternateRigJointAngles(rig, basis.twistPlacement, handed),
    );
    let selected: IAutoMovieResolvedJointAngles = principal;
    let overshoot: number = jointRomOvershoot(
      { bone: domain.bone, ...selected },
      constraint,
    );
    for (const candidate of [align(principal), align(alternate)]) {
      // A reading the alias leaves as the one selected scores the same, so
      // it cannot be strictly better and is not scored again.
      if (
        Object.is(candidate.flexion, selected.flexion) &&
        Object.is(candidate.abduction, selected.abduction) &&
        Object.is(candidate.twist, selected.twist)
      )
        continue;
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

/** A basis's handedness and the twist axis an extraction reads against. */
interface IHandedness {
  /** +1 when flexion × abduction = +twist, else -1. */
  handed: 1 | -1;

  /** The twist axis times the handedness. */
  twistAxis: IAutoMovieVector3;
}

/** Each basis's handedness, remembered with the components it was read from. */
const HANDEDNESS: WeakMap<
  IAutoMovieJointAxes,
  { values: readonly number[]; read: IHandedness }
> = new WeakMap();

/** A basis's nine components, flexion, abduction and twist, each x, y, z. */
const componentsOf = (basis: IAutoMovieJointAxes): number[] => [
  basis.flexion.x,
  basis.flexion.y,
  basis.flexion.z,
  basis.abduction.x,
  basis.abduction.y,
  basis.abduction.z,
  basis.twist.x,
  basis.twist.y,
  basis.twist.z,
];

/**
 * A basis's handedness and signed twist axis, read once per basis record
 * while it holds the components it was read from (compared exactly), so the
 * hundreds of candidates a limb fit decomposes through one basis share it.
 */
const handednessOf = (basis: IAutoMovieJointAxes): IHandedness => {
  const now: number[] = componentsOf(basis);
  const known: { values: readonly number[]; read: IHandedness } | undefined =
    HANDEDNESS.get(basis);
  if (
    known !== undefined &&
    known.values.every((v: number, i: number): boolean => Object.is(v, now[i]))
  )
    return known.read;
  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const read: IHandedness = {
    handed,
    twistAxis: Vector3.scale(basis.twist, handed),
  };
  HANDEDNESS.set(basis, { values: now, read });
  return read;
};

/** Each gated constraint's copy without its swing-twist gate. */
const BOXES: WeakMap<IAutoMovieJointConstraint, IAutoMovieJointConstraint> =
  new WeakMap();

/**
 * A constraint as the readings are ranked by: itself, or for one gated by
 * swing and twist a copy with that gate set aside, the copy remembered per
 * constraint and returned only while every other member is still the one it
 * was copied from.
 */
const boxOf = (
  constraint: IAutoMovieJointConstraint,
): IAutoMovieJointConstraint => {
  if (constraint.swingTwist === undefined || constraint.swingTwist === null)
    return constraint;
  const known: IAutoMovieJointConstraint | undefined = BOXES.get(constraint);
  if (known !== undefined) {
    const keys: string[] = Object.keys(constraint);
    const same: boolean =
      keys.length === Object.keys(known).length &&
      keys.every(
        (key: string): boolean =>
          key === "swingTwist" ||
          Object.is(
            (known as unknown as Record<string, unknown>)[key],
            (constraint as unknown as Record<string, unknown>)[key],
          ),
      );
    if (same) return known;
  }
  const box: IAutoMovieJointConstraint = { ...constraint, swingTwist: null };
  BOXES.set(constraint, box);
  return box;
};
