import {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "./normalizeJointAxes";

type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";

const readAngle: (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axis: AutoMovieClinicalAxis,
  frame: IAutoMovieAxisFrame | undefined,
) => number = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axis: AutoMovieClinicalAxis,
  frame: IAutoMovieRestFrame[AutoMovieClinicalAxis] | undefined,
): number => {
  const value: number | null = joint[axis];
  if (value !== null && !Number.isFinite(value))
    throw new Error(
      `jointToQuaternion ${axis} must be finite or null, but was ${value}`,
    );
  return toRigAngle(value, frame) ?? 0;
};

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
 * @evidence contracts/common.md#principled-implementation An intrinsic Euler composition of three axis-angle quaternions in a declared order, which is a rotation for any orthonormal basis; `normalizeJointAxes` enforces that basis and the frame map is the exact affine inverse of `toClinicalAngle`, so `decomposeJointRotation` round-trips it.
 * @evidence contracts/common.md#clear-and-simple-design The forward half of the joint convention, used by `resolvePose` for every articulated bone; basis checking lives in `normalizeJointAxes` and frame arithmetic in `toRigAngle`, so the forward and inverse maps share those rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads every bone through its declared axes and frame; a `null` angle is the documented rest rotation, and a non-finite angle throws instead of becoming zero.
 * @evidence contracts/common.md#meaningful-documentation States each axis and its default, both composition orders and when each applies, what `null` means, the frame map and its purpose, the inverse function, the thrown inputs, and each parameter's default.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one basis validation and normalization, three axis-angle quaternions and two products.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one joint that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned quaternion.
 */
export const jointToQuaternion: (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axes?: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
) => IAutoMovieQuaternion = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion => {
  const basis: IAutoMovieJointAxes = normalizeJointAxes(
    axes,
    "jointToQuaternion axes",
  );
  const qFlexion: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    basis.flexion,
    readAngle(joint, "flexion", frame?.flexion),
  );
  const qAbduction: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    basis.abduction,
    readAngle(joint, "abduction", frame?.abduction),
  );
  const qTwist: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    basis.twist,
    readAngle(joint, "twist", frame?.twist),
  );
  return basis.twistPlacement === "distal"
    ? Quaternion.multiply(qAbduction, Quaternion.multiply(qFlexion, qTwist))
    : Quaternion.multiply(qTwist, Quaternion.multiply(qAbduction, qFlexion));
};
