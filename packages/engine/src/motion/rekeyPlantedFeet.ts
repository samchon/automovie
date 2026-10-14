import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import { fitChainToTarget } from "./fitChainToTarget";
import { sampleMotion } from "./sampleMotion";

/**
 * Emit one corrected keyframe per admitted parallel time/pose/target sample using the same unchanged skeleton topology as stance detection. Only targeted leg chains are fitted; roots, expressions and other joints persist, while the prior corrected pose ranks equally accurate bend choices.
 *
 * @evidence contracts/common.md#principled-implementation Sequentially fits each pinned chain under the rig's shared clinical axes/rest frames and ROM, carrying the preceding corrected pose as continuity reference; resulting keyframes use linear easing on the existing dense sampling clock.
 * @evidence contracts/common.md#clear-and-simple-design This stage owns correction and frame packaging; stance grouping and pin selection remain pinStanceTargets' responsibility, and fitChainToTarget owns bounded candidate selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Untargeted legs and non-leg joints stay authored; missing/degenerate/unimprovable chains return their current pose rather than manufacturing a successful exact pin.
 * @evidence contracts/common.md#meaningful-documentation States parallel sample premise, topology/clinical agreement, unchanged root/expression/non-chain data and continuity-only prior-pose use.
 * @evidence contracts/performance.md#efficient-algorithms For F frames and L legs, performs F times L target lookups and only actual pins invoke bounded IK/FK search; output is O(F times joint population), with topology prepared once upstream.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses caller topology across all corrected frames and the preceding corrected pose for continuity; frame-specific parent pose and target still require fresh chain preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pass caller owns new keyframes and corrected joints; unchanged root/expression/joints may be shared with sampled input, while no cross-call cache or native handle persists.
 */
export const rekeyPlantedFeet: (props: {
  /** Rig whose unchanged topology and ROM constrain correction. */ skeleton: IAutoMovieSkeleton;
  /** Index of the same unchanged rig already used by stance detection. */ topology: IAutoMovieSkeletonTopology;
  /** Sample times in local seconds, parallel to poses and targets. */ times: readonly number[];
  /** Already sampled pose/expression values at the parallel times. */ poses: ReadonlyArray<
    ReturnType<typeof sampleMotion>
  >;
  /** Declared leg chains eligible for pinned correction. */ legs: readonly IAutoMovieFootLeg[];
  /** Per-frame fixed model-metre contacts keyed by foot bone. */ targets: ReadonlyArray<
    ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>
  >;
  /** Optional clinical axes used to lower and replay solved joints. */ jointAxes?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  >;
  /** Optional clinical rest frames used to lower and replay solved joints. */ restFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;
}) => IAutoMovieKeyframe[] = (props: {
  /** Rig whose unchanged topology and ROM constrain correction. */
  skeleton: IAutoMovieSkeleton;

  /** Index of the same unchanged rig already used by stance detection. */
  topology: IAutoMovieSkeletonTopology;

  /** Sample times in local seconds, parallel to poses and targets. */
  times: readonly number[];

  /** Already sampled pose/expression values at the parallel times. */
  poses: ReadonlyArray<ReturnType<typeof sampleMotion>>;

  /** Declared leg chains eligible for pinned correction. */
  legs: readonly IAutoMovieFootLeg[];

  /** Per-frame fixed model-metre contacts keyed by foot bone. */
  targets: ReadonlyArray<ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>>;

  /** Optional clinical axes used to lower and replay solved joints. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional clinical rest frames used to lower and replay solved joints. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}): IAutoMovieKeyframe[] => {
  const topology: IAutoMovieSkeletonTopology = props.topology;
  const keyframes: IAutoMovieKeyframe[] = [];
  let prior: IAutoMoviePose | undefined;
  props.times.forEach((time: number, index: number): void => {
    const sampled: ReturnType<typeof sampleMotion> = props.poses[index]!;
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

/**
 * The frame's joints with every pinned leg re-solved onto its target: planted
 * legs get their {@link fitChainToTarget} articulation, everything else is
 * carried through unchanged.
 */
const plantedJoints: (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  legs: readonly IAutoMovieFootLeg[],
  targets: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
  topology: IAutoMovieSkeletonTopology,
  referencePose?: IAutoMoviePose,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
) => IAutoMovieJointPose[] = (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  legs: readonly IAutoMovieFootLeg[],
  targets: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
  topology: IAutoMovieSkeletonTopology,
  referencePose?: IAutoMoviePose,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
): IAutoMovieJointPose[] => {
  let joints: IAutoMovieJointPose[] = pose.joints;
  for (const leg of legs) {
    const target: IAutoMovieVector3 | undefined = targets.get(leg.foot);
    if (target === undefined) continue;
    const fitted: IAutoMoviePose = fitChainToTarget({
      skeleton,
      pose: { ...pose, joints },
      chain: { effector: leg.foot, upper: leg.upper, lower: leg.lower },
      target,
      topology,
      referencePose,
      jointAxes,
      restFrames,
    });
    joints = fitted.joints;
  }
  return joints;
};
