import type { IAutoMovieJointAxes } from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../../kinematics/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../../kinematics/internal/normalizeJointAxes";

/*
 * A joint's clinical basis as `decomposeJointRotationOnBasis` reads it: the
 * given axes, or the default ones, admitted and normalized exactly as
 * `decomposeJointRotation` would for each call, done here once per fit.
 * Parameter axes: The bone's clinical axes; omitted, the default basis.
 * Returns: The orthonormal basis.
 */
export function basisOf(
  axes: IAutoMovieJointAxes | undefined,
): IAutoMovieJointAxes {
  return normalizeJointAxes(
    axes ?? DEFAULT_JOINT_AXES,
    "decomposeJointRotation axes",
  );
}
