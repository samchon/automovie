import { IAutoMovieJointAxes } from "../../../../packages/engine/src/kinematics/IAutoMovieJointAxes";
import { DEFAULT_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/DEFAULT_JOINT_AXES";
import { HUMANOID_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/HUMANOID_JOINT_AXES";

/** Retain one shallow copy of the humanoid joint-axis map with leftUpperArm bound to DEFAULT_JOINT_AXES. All other axis records remain shared references, and the attachment case contrasts this basis with the humanoid fallback; these mutable records are not normalized or copied per call. */
export const FILM_ATTACH_JOINT_AXES: typeof HUMANOID_JOINT_AXES & {
  leftUpperArm: IAutoMovieJointAxes;
} = {
  ...HUMANOID_JOINT_AXES,
  leftUpperArm: DEFAULT_JOINT_AXES,
};
