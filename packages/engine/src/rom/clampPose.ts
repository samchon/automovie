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
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Enforces every declared pose joint against the skeleton's effective ranges.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Applies the rig's ROM graph across a complete pose without altering root authority.
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
