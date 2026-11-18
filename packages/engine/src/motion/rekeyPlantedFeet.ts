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

import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { fitSeededChainToTarget } from "./fitSeededChainToTarget";

/**
 * Emit one corrected keyframe per admitted parallel time/pose/target sample using the same unchanged skeleton topology as stance detection. Only targeted leg chains are fitted; roots, expressions and other joints persist, while the prior corrected pose ranks equally accurate bend choices.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Sequentially fits each pinned chain under the rig's shared clinical axes/rest frames and ROM, carrying the preceding corrected pose as continuity reference; resulting keyframes use linear easing on the existing dense sampling clock.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns correction/frame packaging; pinStanceTargets owns grouping/pins and fitSeededChainToTarget owns unchanged bounded selection. Its prepared companion accepts the same source request and one actual target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Untargeted legs and non-leg joints stay authored; missing/degenerate/unimprovable chains return their current pose rather than manufacturing a successful exact pin.
 * @evidence contracts/development/common.md#meaningful-documentation States parallel sample premise, topology/clinical agreement, unchanged root/expression/non-chain data and continuity-only prior-pose use.
 * @evidence contracts/development/implementation.md#efficient-algorithms For F frames and L legs, performs F times L target lookups and only actual pins invoke bounded IK/FK search; output is O(F times joint population), with topology prepared once upstream.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses topology and the preceding corrected pose for continuity. A same-operation reader and genuine immutable rig share exact static/FK dependencies with detection; raw omission retains full admission. Each changed frame/chain source still receives fresh target-specific preparation and solve.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns new keyframes/joints; unchanged root/expression/joints may be shared. A local or borrowed operation reader releases with the synchronous pass; a borrowed immutable rig remains caller-owned. No target history, global cache or handle persists.
 */
export const rekeyPlantedFeet: (
  props: rekeyPlantedFeet.IProps,
) => IAutoMovieKeyframe[] = (
  props: rekeyPlantedFeet.IProps,
): IAutoMovieKeyframe[] => {
  const topology: IAutoMovieSkeletonTopology = props.topology;
  const keyframes: IAutoMovieKeyframe[] = [];
  const resolution: ReturnType<typeof preparePoseResolution> =
    props.resolution ?? preparePoseResolution();
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
};

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
  resolution?: ReturnType<typeof preparePoseResolution>,
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
  resolution?: ReturnType<typeof preparePoseResolution>,
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

/**
 * Companion types of {@link rekeyPlantedFeet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the two engine-owned extensions of the interface re-keying props and their absence rules.
 * @evidence contracts/development/design.md#principled-representation The canonical re-keying props stay in `IAutoMovieRekeyPlantedFeet.IProps`; this extension adds only the same-operation FK reader and the prepared rig, engine objects from `preparePoseResolution` and `prepareSkeletonPoseResolution`, so they cannot live in the dependency-free interface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `plantStanceFeet` passes its detection reader and prepared rig so correction shares them; every other caller keeps the interface props unchanged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the interface contract instead of copying it; both optional members are the genuine engine products, never structural stand-ins.
 */
export namespace rekeyPlantedFeet {
  /**
   * The re-keying props with the optional shared FK reader and prepared rig.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each added member states what it is and what its absence keeps.
   * @evidence contracts/development/design.md#principled-representation The interface props plus two optional engine products; nothing of the interface record is repeated.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional members, read by the correction `plantStanceFeet` shares them with.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the interface record instead of copying it; neither member is a flag or a structural stand-in.
   */
  export interface IProps extends IAutoMovieRekeyPlantedFeet.IProps {
    /** Optional same-operation exact FK reader shared with stance detection. */
    resolution?: ReturnType<typeof preparePoseResolution>;

    /** Optional immutable snapshot of this exact rig/topology/clinical tables. */
    poseResolution?: prepareSkeletonPoseResolution.IRig;
  }
}
