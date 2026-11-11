import { IAutoMovieJointAxes, IAutoMovieQuaternion } from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieJointRotationDomain } from "./IAutoMovieJointRotationDomain";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { decomposeJointRotationOnBasis } from "./decomposeJointRotationOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";

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
 * The pin holds within a projected cosine of the square root of the unit
 * roundoff, about 1.5e-8, where the two outer angles are otherwise rounding
 * noise and the pinned angles rebuild the rotation within 1e-7 radian.
 * A left-handed basis, such as the default (`flexion × abduction = −twist`),
 * is extracted against `−twist` and the twist sign restored, so the round trip
 * holds for any orthonormal basis.
 *
 * `frame` lifts the rest-relative angles to clinical ones,
 * `clinical = sign · r + neutral`. A `domain` with a non-null constraint also
 * considers the rotation's second Euler chart, `(f + 180, 180 − a, t + 180)`
 * for a proximal twist and `(180 − f, a + 180, t + 180)` for a distal one, and
 * the full-turn alias of each angle nearest the constraint's range. The
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
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form Euler extraction reads sine and projected cosine through atan2, preserving resolvable near-gimbal rotations that asin can round to ninety degrees; only a projected cosine within the square root of the binary64 unit roundoff, where a rounding error and the pin's truncation error meet, takes the undetermined-angle convention. Normalized orthogonal axes and unit input rotations are the premises, and alternate charts/full turns retain the same rotation up to roundoff.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The extraction, the handedness correction, the clinical lift and the ROM chart choice sit in one inverse because each depends on the others' convention; ROM scoring is delegated to `jointRomOvershoot` and frame arithmetic to `toClinicalAngle`, so the gate and this inverse read one rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair, not a compensation, and no bone is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States the inverse relationship, both composition orders, the gimbal convention, the handedness correction, the frame lift, both alternate charts and the tie rule, the thrown inputs, the unit-quaternion premise, and each parameter's default.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time: one basis validation, three vector rotations and at most a dozen dot products, plus, with a domain, three ROM scorings; no matrix is built.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one rotation that coordinates no work across calls; the arm solve calls it per candidate with a different rotation each time.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned angles.
 */
export const decomposeJointRotation: (
  q: IAutoMovieQuaternion,
  axes?: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
  domain?: IAutoMovieJointRotationDomain | undefined,
) => IAutoMovieResolvedJointAngles = (
  q: IAutoMovieQuaternion,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
  domain?: IAutoMovieJointRotationDomain,
): IAutoMovieResolvedJointAngles =>
  // The extraction lives in `decomposeJointRotationOnBasis`, which a solver
  // calls directly on a basis it normalized once; this entry admits the basis.
  decomposeJointRotationOnBasis(
    q,
    normalizeJointAxes(axes, "decomposeJointRotation axes"),
    frame,
    domain,
  );
