import type { IAutoMovieJointAxes, IAutoMovieRestFrame } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
type JointAxesTable = Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
>;
/**
 * Leave joint-axis overrides undefined for the existing cat/horse pages. Their arm-named slots are downward front legs, so humanoid T-pose remapping would reinterpret the authored raw-rig-space angles. This absence is a mapping choice rather than measured anatomy or observed clip/geometry compatibility, and it retains no mutable record or runtime resource.
 *
 * @author Samchon
 */
export const QUADRUPED_JOINT_AXES: JointAxesTable | undefined = undefined;
