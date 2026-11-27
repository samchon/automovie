import type {
  AutoMovieHumanoidBone,
  IAutoMovieFootLeg,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotionSample,
  IAutoMoviePose,
  IAutoMovieRekeyPlantedFeet,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../kinematics/AutoMovieEngineKinematics";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { fitSeededChainToTarget } from "./fitSeededChainToTarget";

/**
 * Emit one corrected keyframe per admitted parallel time/pose/target sample
 * using the same unchanged skeleton topology as stance detection. Only targeted
 * leg chains are fitted; roots, expressions and other joints persist, while the
 * prior corrected pose ranks equally accurate bend choices.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States parallel sample premise, topology/clinical agreement, unchanged root/expression/non-chain data and continuity-only prior-pose use.
 */
export function rekeyPlantedFeet(
  props: rekeyPlantedFeet.IProps,
): IAutoMovieKeyframe[] {
  const topology: IAutoMovieSkeletonTopology = props.topology;
  const keyframes: IAutoMovieKeyframe[] = [];
  const resolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> =
    props.resolution ?? AutoMovieEngineKinematics.preparePoseResolution();
  let prior: IAutoMoviePose | undefined;
  props.times.forEach((time: number, index: number): void => {
    const sampled: IAutoMovieMotionSample = props.poses[index]!;
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
        resolution,
        props.poseResolution,
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
}

/**
 * The frame's joints with every pinned leg re-solved onto its target: planted
 * legs get their {@link fitSeededChainToTarget} articulation, everything else is
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
  resolution?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  poseResolution?: prepareSkeletonPoseResolution.IRig,
) => IAutoMovieJointPose[] = (
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  legs: readonly IAutoMovieFootLeg[],
  targets: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
  topology: IAutoMovieSkeletonTopology,
  referencePose?: IAutoMoviePose,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  resolution?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  poseResolution?: prepareSkeletonPoseResolution.IRig,
): IAutoMovieJointPose[] => {
  let joints: IAutoMovieJointPose[] = pose.joints;
  for (const leg of legs) {
    const target: IAutoMovieVector3 | undefined = targets.get(leg.foot);
    if (target === undefined) continue;
    const fitted: IAutoMoviePose = fitSeededChainToTarget
      .prepare(
        {
          skeleton,
          pose: { ...pose, joints },
          chain: { effector: leg.foot, upper: leg.upper, lower: leg.lower },
          topology,
          referencePose,
          jointAxes,
          restFrames,
        },
        undefined,
        resolution,
        poseResolution,
      )
      .fit(target).pose;
    joints = fitted.joints;
  }
  return joints;
};

/** Companion types of {@link rekeyPlantedFeet}. */
export namespace rekeyPlantedFeet {
  /** The re-keying props with the optional shared FK reader and prepared rig. */
  export interface IProps extends IAutoMovieRekeyPlantedFeet.IProps {
    /** Optional same-operation exact FK reader shared with stance detection. */
    resolution?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>;

    /** Optional immutable snapshot of this exact rig/topology/clinical tables. */
    poseResolution?: prepareSkeletonPoseResolution.IRig;
  }
}
