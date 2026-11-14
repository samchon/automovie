import type { IAutoMovieJointAxes } from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";

/**
 * A joint's clinical basis as `decomposeJointRotationOnBasis` reads it: the
 * given axes, or the default ones, admitted and normalized exactly as
 * `decomposeJointRotation` would for each call, done here once per fit.
 *
 * @param axes The bone's clinical axes; omitted, the default basis.
 * @returns The orthonormal basis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is admitted, its default and why once per fit.
 * @evidence contracts/development/implementation.md#principled-implementation The same admission the decomposition makes, so a basis read here is the one it reads.
 * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One call.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `normalizeJointAxes`, which remembers a record's basis.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function basisOf(
  axes: IAutoMovieJointAxes | undefined,
): IAutoMovieJointAxes {
  return normalizeJointAxes(
    axes ?? DEFAULT_JOINT_AXES,
    "decomposeJointRotation axes",
  );
}
