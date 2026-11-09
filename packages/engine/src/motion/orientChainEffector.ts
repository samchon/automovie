import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { resolveBoneMap } from "./resolveBoneMap";
import { splitDistalTwist } from "./splitDistalTwist";

/**
 * Turn the fitted chain's effector to a requested model-frame rotation: its
 * local articulation is the lower bone's world rotation undone, then its
 * rest rotation undone, read back as clinical angles through the same axes
 * and rest frames and clamped to the rig's range of motion.
 *
 * @param props The fit request; without `effectorRotation` the pose returns unchanged.
 * @param pose The fitted pose.
 * @returns The pose with the effector oriented.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the twist split first, the effector's local articulation, the decomposition and the clamp.
 * @evidence contracts/development/implementation.md#principled-implementation The effector's local rotation is the mid bone's world rotation and the effector's rest undone from the request, read back as clinical angles and clamped; a distal twist share is moved first by splitDistalTwist.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics, one decomposition and one clamp after the twist split.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable rotation is clamped, never reported as reached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two forward kinematics passes, linear in bones.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function orientChainEffector(
  props: IFitChainToTargetProps,
  fitted: IAutoMoviePose,
): IAutoMoviePose {
  if (props.effectorRotation === undefined) return fitted;
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(props.skeleton, props.jointAxes);
  const pose: IAutoMoviePose = splitDistalTwist(props, axes, fitted, props.effectorRotation);
  const lower: IAutoMovieResolvedBone = resolveBoneMap(
    props.skeleton,
    pose,
    props.topology,
    axes,
    props.restFrames,
  ).get(props.chain.lower)!;
  const rest: IAutoMovieQuaternion =
    props.skeleton.bones.find(
      (b: (typeof props.skeleton.bones)[number]): boolean =>
        b.bone === props.chain.effector,
    )?.rest.rotation ?? Quaternion.identity();
  const local: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.inverse(rest),
      Quaternion.multiply(
        Quaternion.inverse(lower.worldRotation),
        props.effectorRotation,
      ),
    ),
  );
  const angles: ReturnType<typeof decomposeJointRotation> =
    decomposeJointRotation(
      local,
      axes[props.chain.effector],
      props.restFrames?.[props.chain.effector],
    );
  const effector: IAutoMovieJointPose = clampJointToSkeleton(
    {
      bone: props.chain.effector,
      flexion: angles.flexion,
      abduction: angles.abduction,
      twist: angles.twist,
    },
    props.skeleton,
  );
  return {
    ...pose,
    joints: [
      ...pose.joints.filter(
        (joint: IAutoMovieJointPose): boolean =>
          joint.bone !== props.chain.effector,
      ),
      effector,
    ],
  };
}
