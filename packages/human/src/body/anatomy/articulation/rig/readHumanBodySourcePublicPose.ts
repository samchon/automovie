import { jointToQuaternion } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMovieQuaternion } from "@automovie/interface";

import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";

/**
 * Read supported explicit public coordinates through their original clinical converter; undeclared axes are never applied.
 *
 * Omitted supported coordinates pass null to the clinical converter. Consumed explicit coordinates are added to the caller-owned used set; the graph coordinator separately refuses authored coordinates that no source consumer accepted. The admitted joint axes and rest frame retain the original clinical degree/sign and twist-order conventions.
 *
 * @evidence contracts/common.md#principled-implementation Only declared flexion, abduction and twist coordinates enter the existing clinical jointToQuaternion conversion; undeclared coordinates stay null for later unsupported-goal refusal.
 * @evidence contracts/common.md#clear-and-simple-design The clinical conversion remains in engine while this reader owns source-supported-axis selection and consumed-goal accounting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It preserves the registered clinical rest frame and twist order rather than using generic Euler angles or silently applying unsupported coordinates.
 * @evidence contracts/common.md#meaningful-documentation The description states supported-coordinate conversion; expanded prose explains omission, used-set mutation and the graph owner's unsupported-goal responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Finding one public row costs O(P) for P pose rows; supported-axis checks operate on at most three closed clinical coordinates and quaternion conversion has fixed size.
 * @evidence contracts/performance.md#reuse-equivalent-work The actual joint axes and rest frame are passed to the existing converter, avoiding a second clinical mapping implementation or cached pose assumptions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the caller-owned consumed-goal set is mutated; the returned quaternion is numerical output and no row array is retained.
 */
export function readHumanBodySourcePublicPose(
  joint: Pick<
    IAutoMovieHumanBodySourcePublicPoseJoint,
    "bone" | "axes" | "restFrame" | "supportedAxes"
  >,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieQuaternion {
  const goal: IAutoMovieJointPose | undefined = input.pose.find((one: IAutoMovieJointPose): boolean => one.bone === joint.bone);
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
