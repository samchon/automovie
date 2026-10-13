import { IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";

import { clampJointToSkeleton } from "./clampJointToSkeleton";

/**
 * Clamp every joint of a pose into its skeleton's ROM, returning a new pose
 * (the root transform is untouched). A joint whose bone has no constraint
 * (neither a per-bone override nor a default-table entry) passes through
 * unchanged.
 *
 * This is what makes a joint behave like a limited physics joint: feed any pose
 * (e.g. raw LLM output) through `clampPose` and it can no longer exceed each
 * joint's gamut, the same bounds {@link validateJointRom} reports `// ❌` for.
 *
 * @author Samchon
 */
export const clampPose = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMoviePose => ({
  skeleton: pose.skeleton,
  root: pose.root,
  joints: pose.joints.map((joint) => clampJointToSkeleton(joint, skeleton)),
});
