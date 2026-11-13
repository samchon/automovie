import {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";

type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";
/**
 * Convert a joint's clinical flexion, abduction and twist, in degrees, into
 * one bone-local rotation quaternion.
 *
 * Flexion turns about `axes.flexion` (default local X, sagittal), abduction
 * about `axes.abduction` (default Z, frontal) and twist about `axes.twist`
 * (default Y, the bone's long axis). The composition follows
 * `axes.twistPlacement`. A proximal twist, the default, turns the swing axes
 * with it, as the head turns below its nodding joint:
 *
 *     q = qTwist · qAbduction · qFlexion
 *
 * A distal twist turns the moved segment about its own long axis before the
 * swing, as the forearm pronates beyond the elbow, so a pose without twist is
 * the same rotation in either placement:
 *
 *     q = qAbduction · qFlexion · qTwist
 *
 * `axes` lets a rig whose bone frames are not aligned to the clinical planes
 * keep flexion sagittal, such as a T-pose arm that needs flexion about Y. A
 * `null` angle contributes no rotation. With a `frame`, each angle is read as
 * clinical and mapped to the rig's rest-relative angle,
 * `r = (clinical − neutral) / sign`, so one clinical convention serves both
 * sides of a mirrored rig. {@link decomposeJointRotation} is the inverse for
 * the same `axes` and `frame`.
 *
 * Throws on a non-finite angle, an invalid axis basis (see
 * {@link normalizeJointAxes}), or an invalid frame sign or neutral.
 *
 * @param joint Clinical angles in degrees; `null` axes are at rest.
 * @param axes Clinical axis basis; defaults to `DEFAULT_JOINT_AXES`.
 * @param frame Rest frame mapping clinical angles to rest-relative ones;
 *   omitted, the angles are already rest-relative.
 *
 * @evidence contracts/development/implementation.md#principled-implementation An intrinsic Euler composition of three axis-angle quaternions in a declared order, which is a rotation for any orthonormal basis; `normalizeJointAxes` enforces that basis and the frame map is the exact affine inverse of `toClinicalAngle`, so `decomposeJointRotation` round-trips it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The forward half of the joint convention, used by `resolvePose` for every articulated bone: `jointToQuaternionOnBasis` behind one `normalizeJointAxes`, so basis checking and composition each live in one place and the forward and inverse maps share those rules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads every bone through its declared axes and frame; a `null` angle is the documented rest rotation, and a non-finite angle throws instead of becoming zero.
 * @evidence contracts/development/common.md#meaningful-documentation States each axis and its default, both composition orders and when each applies, what `null` means, the frame map and its purpose, the inverse function, the thrown inputs, and each parameter's default.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time: one basis admission (a remembered record costs ten comparisons), three axis-angle quaternions and two products.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one joint that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned quaternion.
 */
export const jointToQuaternion: (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axes?: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
) => IAutoMovieQuaternion = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion =>
  jointToQuaternionOnBasis(
    joint,
    normalizeJointAxes(axes, "jointToQuaternion axes"),
    frame,
  );
