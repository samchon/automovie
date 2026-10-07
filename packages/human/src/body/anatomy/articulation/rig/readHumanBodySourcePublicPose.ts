import { jointToQuaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";

/** Read supported explicit public coordinates through their original clinical converter; undeclared axes are never applied. */
export function readHumanBodySourcePublicPose(
  joint: Pick<
    IAutoMovieHumanBodySourcePublicPoseJoint,
    "bone" | "axes" | "restFrame" | "supportedAxes"
  >,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieQuaternion {
  const goal = input.pose.find((one) => one.bone === joint.bone);
  for (const axis of joint.supportedAxes)
    if (goal?.[axis] !== undefined && goal[axis] !== null)
      used.add(`public-pose.${joint.bone}.${axis}`);
  return jointToQuaternion(
    {
      flexion: joint.supportedAxes.includes("flexion")
        ? (goal?.flexion ?? null)
        : null,
      abduction: joint.supportedAxes.includes("abduction")
        ? (goal?.abduction ?? null)
        : null,
      twist: joint.supportedAxes.includes("twist")
        ? (goal?.twist ?? null)
        : null,
    },
    joint.axes,
    joint.restFrame,
  );
}
