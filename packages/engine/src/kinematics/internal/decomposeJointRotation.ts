import type {
  IAutoMovieJointAxes,
  IAutoMovieJointRotationDomain,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../constants/DEFAULT_JOINT_AXES";
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
 * `qAbduction · qFlexion · qTwist` into `Ry·Rx·Rz`. The explicit clinical order
 * `qFlexion · qAbduction · qTwist` uses `Rx·Ry·Rz`. The inverse reads each
 * matrix from dot products of the axes with the rotated axes. At the gimbal
 * (middle angle ±90°), only one combination of the outer angles is determined.
 * The inverse pins flexion for a legacy proximal twist, abduction for a legacy
 * distal twist, and twist for the explicit clinical order to zero, preserving
 * the observable combination. The pin holds within a projected cosine of the
 * square root of the unit roundoff, about 1.5e-8, where the two outer angles
 * are otherwise rounding noise and the pinned angles rebuild the rotation
 * within 1e-7 radian. A left-handed basis, such as the default (`flexion ×
 * abduction = −twist`), is extracted against `−twist` and the twist sign
 * restored, so the round trip holds for any orthonormal basis.
 *
 * `frame` lifts the rest-relative angles to clinical ones, `clinical = sign · r
 * + neutral`. A `domain` with a non-null constraint also considers the
 * rotation's second Euler chart, `(f + 180, 180 − a, t + 180)` for proximal
 * twist and flexion-abduction-twist, and `(180 − f, a + 180, t + 180)` for a
 * distal one, and the full-turn alias of each angle nearest the constraint's
 * range. The candidate with the least {@link jointRomOvershoot} wins, the
 * principal chart on a tie. Every candidate is the same rotation, so a pose no
 * chart can hold keeps its overshoot instead of being clamped.
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
  decomposeJointRotationOnBasis.run(
    q,
    normalizeJointAxes(axes, "decomposeJointRotation axes"),
    frame,
    domain,
  );
