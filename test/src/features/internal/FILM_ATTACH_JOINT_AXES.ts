import { DEFAULT_JOINT_AXES, HUMANOID_JOINT_AXES } from "@automovie/engine";

/** Preserve the existing custom arm basis used by the attach FK comparison. */
export const FILM_ATTACH_JOINT_AXES = {
  ...HUMANOID_JOINT_AXES,
  leftUpperArm: DEFAULT_JOINT_AXES,
};
