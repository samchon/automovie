import { AutoMovieHumanoidBone, IAutoMovieKeyframe, IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import { sampleMotion } from "./sampleMotion";

/**
 * Re-key the sampled frames densely, re-solving every pinned leg onto its
 * stance target (the assembly stage of {@link plantStanceFeet}). Optional
 * clinical mappings must be the same ones used to resolve the stance samples
 * and later play the returned motion.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Re-solves every sample inside each declared planted interval while leaving swing samples unpinned.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Bakes the resolved support targets back into the motion keyframes.
 */
export const rekeyPlantedFeet = (props: {
  skeleton: IAutoMovieSkeleton;
  times: readonly number[];
  poses: ReadonlyArray<ReturnType<typeof sampleMotion>>;
  legs: readonly IAutoMovieFootLeg[];
  targets: ReadonlyArray<ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>>;
  /** Optional clinical axes used to lower and replay solved joints. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  /** Optional clinical rest frames used to lower and replay solved joints. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}): IAutoMovieKeyframe[] => {
  const topology = indexSkeletonTopology(props.skeleton);
  const keyframes: IAutoMovieKeyframe[] = [];
  let prior: IAutoMoviePose | undefined;
  props.times.forEach((time, index) => {
    const sampled = props.poses[index]!;
    const pose: IAutoMoviePose = {
      skeleton: sampled.pose.skeleton,
      root: sampled.pose.root,
      joints: plantedJoints(
        props.skeleton,
        sampled.pose,
        props.legs,
        props.targets[index]!,
        topology,
        prior,
        props.jointAxes,
        props.restFrames,
      ),
    };
    keyframes.push({
      time,
      pose,
      expression: sampled.expression,
      easing: "linear",
      bezier: null,
    });
    prior = pose;
  });
  return keyframes;
};
