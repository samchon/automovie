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
import { normalizeJointAxes } from "./normalizeJointAxes";

/** Degrees per radian for the closed-form angle extraction. */
const RAD2DEG: number = 180 / Math.PI;

/** Quaternion components in their existing finite-admission order. */
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

/** Reject the first nonfinite component at the inverse's existing diagnostic path. */
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
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form Euler extraction reads each angle's sine and projected cosine through atan2; a projected cosine within the square root of the binary64 unit roundoff, where a rounding error and the pin's truncation error meet, takes the undetermined-angle convention. Among the principal chart, the alternate chart and each angle's full-turn alias nearest its range, the least ROM overshoot wins, and every candidate is the same rotation. Nonnegative fault distances prove that an exact zero score is an unbeatable lower bound under the existing strict-improvement tie rule. A constraint's `swingTwist` is set aside while the readings are ranked, since both readings of one rotation lie equally inside such a gate; the three-angle box ranks them, so the reading a pose reports stays the one it always was.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The inverse owns extraction, handedness, clinical lift and chart choice. Private clinical/align/lift helpers take their actual frame/domain arguments instead of per-call closures; scoring, aliases and frame arithmetic stay with their existing owners, and decomposeJointRotation admits the basis before this inverse.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair, and no bone is special-cased. Only exact zero terminates further score comparisons; quaternion/frame admission, alternate clinical conversion and eager alias construction retain their original order, with no tolerance or projected answer substitution. Immutable metadata reuse recognizes only the normalizer's actual owned records, never caller-controlled freeze state, descriptors or matching values.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three vector rotations, fixed dot products and at most three overshoot scores remain constant work. Scoring stops at the exact zero lower bound, saving up to two fault scans and their temporary joint records; both aliases still build eagerly. Handedness hits avoid component arrays, and the normalizer's own immutable records additionally avoid nine component comparisons; each cold miss adds one weak ownership lookup. Ordinary bases retain nine comparisons. Box hits avoid key arrays/comparison closures; misses add one key-count array and metadata record. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller supplies its already admitted basis. Existing weak handedness preparation uses the normalizer's private exact-identity provenance for its frozen own-data outputs; all other bases, including wrappers, copies, inherited records, user-frozen data and accessors, keep the original component reads and Object.is comparisons. No descriptor probe, added numeric read or exception catch changes that admission boundary. Matching own key names/count and field identities detect constraint shape or member replacement. Every incoming quaternion is decomposed normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fresh angles. Existing weak maps retain at most one nine-scalar handedness snapshot, signed twist vector and borrowed immutable-owner flag per live basis, and one borrowed-member box copy with one key-count metadata record per live gated constraint. The normalizer owns weak provenance of its created bases; no pose, quaternion result, callback, handle or task is retained here.
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

  // Right-handedness of the basis: +1 when flex × abd = +twist. A left-handed
  // triple is made right-handed by extracting against −twist, then negating the
  // recovered twist (a rotation about −t by θ is one about t by −θ).
  const { handed, twistAxis }: IHandedness = handednessOf(basis);

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
      return lift(
        {
          flexion: r12 < 0 ? 90 : -90,
          abduction: 0,
          twist: handed * Math.atan2(-r01, r00) * RAD2DEG,
        },
        basis,
        handed,
        frame,
        domain,
      );
    }
    return lift(
      {
        flexion: Math.atan2(-r12, cosine) * RAD2DEG,
        abduction:
          Math.atan2(Vector3.dot(basis.flexion, Rt), Vector3.dot(twistAxis, Rt)) *
          RAD2DEG,
        twist: handed * Math.atan2(r10, r11) * RAD2DEG,
      },
      basis,
      handed,
      frame,
      domain,
    );
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
    return lift(
      { flexion: 0, abduction, twist: handed * twist },
      basis,
      handed,
      frame,
      domain,
    );
  }

  return lift(
    {
      flexion: Math.atan2(m21, m22) * RAD2DEG,
      abduction: Math.atan2(-m20, cosine) * RAD2DEG,
      twist: handed * Math.atan2(m10, m00) * RAD2DEG,
    },
    basis,
    handed,
    frame,
    domain,
  );
};

/** Lift the three numerical rig angles through the unchanged clinical frame. */
function clinical(
  rig: IAutoMovieResolvedJointAngles,
  frame: IAutoMovieRestFrame | undefined,
): IAutoMovieResolvedJointAngles {
  // toClinicalAngle only returns null for a null input; these are numbers.
  return {
    flexion: toClinicalAngle(rig.flexion, frame?.flexion)!,
    abduction: toClinicalAngle(rig.abduction, frame?.abduction)!,
    twist: toClinicalAngle(rig.twist, frame?.twist)!,
  };
}

/** Read each candidate's full-turn alias against its corresponding box interval. */
function align(
  candidate: IAutoMovieResolvedJointAngles,
  constraint: IAutoMovieJointConstraint,
): IAutoMovieResolvedJointAngles {
  return {
    flexion: nearestAngleAlias(candidate.flexion, constraint.flexion),
    abduction: nearestAngleAlias(candidate.abduction, constraint.abduction),
    twist: nearestAngleAlias(candidate.twist, constraint.twist),
  };
}

/** Preserve principal/alternate chart construction, score order and principal-on-tie selection. */
function lift(
  rig: IAutoMovieResolvedJointAngles,
  basis: IAutoMovieJointAxes,
  handed: 1 | -1,
  frame: IAutoMovieRestFrame | undefined,
  domain: IAutoMovieJointRotationDomain | undefined,
): IAutoMovieResolvedJointAngles {
  const principal: IAutoMovieResolvedJointAngles = clinical(rig, frame);
  if (domain === undefined || domain.constraint === null) return principal;

  // Both Euler readings of one rotation share its swing-twist status; the
  // unchanged three-angle box ranks only the readings the pose can report.
  const constraint: IAutoMovieJointConstraint = boxOf(domain.constraint);
  const alternate: IAutoMovieResolvedJointAngles = clinical(
    alternateRigJointAngles(rig, basis.twistPlacement, handed),
    frame,
  );
  let selected: IAutoMovieResolvedJointAngles = principal;
  let overshoot: number = jointRomOvershoot(
    { bone: domain.bone, ...selected },
    constraint,
  );
  for (const candidate of [
    align(principal, constraint),
    align(alternate, constraint),
  ]) {
    // Nonnegative ROM fault distances cannot improve an exact zero score.
    // Both aliases have already been constructed in their original order.
    if (overshoot === 0) break;

    // An unchanged alias scores the same and cannot be strictly better.
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
}

/** A basis's handedness and the twist axis an extraction reads against. */
interface IHandedness {
  /** +1 when flexion × abduction = +twist, else -1. */
  handed: 1 | -1;

  /** The twist axis times the handedness. */
  twistAxis: IAutoMovieVector3;
}

/** One basis's completed handedness and proof of when it can be reused. */
interface IHandednessState {
  /** The nine original component values for bases whose data can change. */
  values: readonly number[];

  /** The pure signed-axis metadata used by every extraction on this basis. */
  read: IHandedness;

  /** Whether the normalizer owns this exact immutable own-data basis. */
  fixed: boolean;
}

/** Each basis's handedness, remembered with the components it was read from. */
const HANDEDNESS: WeakMap<IAutoMovieJointAxes, IHandednessState> = new WeakMap();

/** A basis's nine components, flexion, abduction and twist, each x, y, z. */
const componentsOf: (basis: IAutoMovieJointAxes) => number[] = (
  basis: IAutoMovieJointAxes,
): number[] => [
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

/** Match the existing snapshot without allocating another nine-component array. */
function sameComponents(
  values: readonly number[],
  basis: IAutoMovieJointAxes,
): boolean {
  return (
    Object.is(values[0], basis.flexion.x) &&
    Object.is(values[1], basis.flexion.y) &&
    Object.is(values[2], basis.flexion.z) &&
    Object.is(values[3], basis.abduction.x) &&
    Object.is(values[4], basis.abduction.y) &&
    Object.is(values[5], basis.abduction.z) &&
    Object.is(values[6], basis.twist.x) &&
    Object.is(values[7], basis.twist.y) &&
    Object.is(values[8], basis.twist.z)
  );
}

/**
 * A basis's handedness and signed twist axis, read once per basis record
 * when its normalizer owns the immutable record, otherwise while exact
 * comparisons match the original values. Hundreds of limb-fit
 * candidates therefore share the same metadata without caching any inverse.
 */
const handednessOf: (basis: IAutoMovieJointAxes) => IHandedness = (
  basis: IAutoMovieJointAxes,
): IHandedness => {
  const known: IHandednessState | undefined = HANDEDNESS.get(basis);
  if (
    known !== undefined &&
    (known.fixed || sameComponents(known.values, basis))
  )
    return known.read;
  const now: number[] = componentsOf(basis);

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
  HANDEDNESS.set(basis, {
    values: now,
    read,
    fixed: normalizeJointAxes.owns(basis),
  });
  return read;
};

/** A private box copy and its invariant own-string-key count. */
interface IBox {
  /** The original constraint's copied fields, with only swingTwist set aside. */
  constraint: IAutoMovieJointConstraint;

  /** This private copy's own enumerable string-key count, unchanged after creation. */
  size: number;
}

/** Each gated constraint's copy without its swing-twist gate. */
const BOXES: WeakMap<IAutoMovieJointConstraint, IBox> = new WeakMap();

/** Match own key names/count and field identities without per-hit key arrays. */
function sameBox(known: IBox, constraint: IAutoMovieJointConstraint): boolean {
  let size: number = 0;
  for (const key in constraint) {
    if (!Object.prototype.hasOwnProperty.call(constraint, key)) continue;
    ++size;
    if (
      !Object.prototype.hasOwnProperty.call(known.constraint, key) ||
      (key !== "swingTwist" &&
        !Object.is(
          (known.constraint as unknown as Record<string, unknown>)[key],
          (constraint as unknown as Record<string, unknown>)[key],
        ))
    )
      return false;
  }
  return size === known.size;
}

/**
 * A constraint as the readings are ranked by: itself, or for one gated by
 * swing and twist a copy with that gate set aside, the copy remembered per
 * constraint and returned only while every other member is still the one it
 * was copied from.
 */
const boxOf: (
  constraint: IAutoMovieJointConstraint,
) => IAutoMovieJointConstraint = (
  constraint: IAutoMovieJointConstraint,
): IAutoMovieJointConstraint => {
  if (constraint.swingTwist === undefined || constraint.swingTwist === null)
    return constraint;
  const known: IBox | undefined = BOXES.get(constraint);
  if (known !== undefined && sameBox(known, constraint)) return known.constraint;
  const box: IAutoMovieJointConstraint = { ...constraint, swingTwist: null };
  BOXES.set(constraint, { constraint: box, size: Object.keys(box).length });
  return box;
};
