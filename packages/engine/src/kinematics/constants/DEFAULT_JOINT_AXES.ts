import { IAutoMovieJointAxes } from "../IAutoMovieJointAxes";

/** The default clinical basis: flexion→X, abduction→Z, twist→Y. */
export const DEFAULT_JOINT_AXES: IAutoMovieJointAxes = {
  flexion: { x: 1, y: 0, z: 0 },
  abduction: { x: 0, y: 0, z: 1 },
  twist: { x: 0, y: 1, z: 0 },
};
