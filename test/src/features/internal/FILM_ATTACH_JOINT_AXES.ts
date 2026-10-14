import { IAutoMovieJointAxes, DEFAULT_JOINT_AXES, HUMANOID_JOINT_AXES } from "@automovie/engine";



/** Retain one shallow copy of the humanoid joint-axis map with leftUpperArm bound to DEFAULT_JOINT_AXES. All other axis records remain shared references, and the attachment case contrasts this basis with the humanoid fallback; these mutable records are not normalized or copied per call. */
export const FILM_ATTACH_JOINT_AXES: typeof HUMANOID_JOINT_AXES & {
  leftUpperArm: IAutoMovieJointAxes;
} = {
  ...HUMANOID_JOINT_AXES,
  leftUpperArm: DEFAULT_JOINT_AXES,
};
