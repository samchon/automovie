import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { Quaternion } from "../math/Quaternion";
import { swingTwist } from "../math/swingTwist";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { resolveBoneMap } from "./resolveBoneMap";

/**
 * Give a distally twisting mid bone (a forearm, which pronates and supinates
 * about its own length beyond the elbow's hinge) the share of an effector
 * rotation that is a twist about that length, so the wrist keeps only the
 * flexion and deviation it can make.
 *
 * The effector's rotation in the mid bone's frame, `Q` (the mid bone's world
 * rotation undone from the requested rotation), is split by the
 * swing-twist decomposition about the mid bone's twist axis (`swingTwist`),
 * `Q = S T`: the
 * twist `T` moves to the mid joint, where a distal twist composes after the
 * flexion (`A' = A T`), and what the effector is left with, `T^-1 S T`, is a
 * pure swing. The mid joint is read back as clinical angles in its domain and
 * clamped to the rig's range, so a twist beyond pronation or supination
 * leaves its excess to the effector's own clamp. A twist about the bone's own
 * length leaves the effector's joint where it is, so the effector stays on its
 * target. Bones without a distal twist are returned unchanged.
 *
 * @param props The fit request.
 * @param axes Merged joint axes.
 * @param pose The fitted pose.
 * @param rotation The requested effector rotation.
 * @returns The pose with the mid bone's twist set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the decomposition, where each share goes, the clamp and why the effector stays.
 * @evidence contracts/development/implementation.md#principled-implementation The swing-twist decomposition about the mid bone's twist axis, composed after its articulation as a distal twist composes, read back through its clinical domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics, one decomposition and one clamp.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A twist past the range is clamped, leaving its excess to the effector's clamp and the reported residual.
 * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics pass, linear in bones.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function splitDistalTwist(
  props: IFitChainToTargetProps,
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  pose: IAutoMoviePose,
  rotation: IAutoMovieQuaternion,
): IAutoMoviePose {
  const lowerAxes: IAutoMovieJointAxes | undefined = axes[props.chain.lower];
  if (lowerAxes?.twistPlacement !== "distal") return pose;
  const world: IAutoMovieResolvedBone = resolveBoneMap(
    props.skeleton,
    pose,
    props.topology,
    axes,
    props.restFrames,
  ).get(props.chain.lower)!;

  // The effector's rotation in the mid bone's frame; its twist about the mid
  // bone's own axis is what the mid joint can take over.
  const needed: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(Quaternion.inverse(world.worldRotation), rotation),
  );
  const { twist } = swingTwist(needed, lowerAxes.twist);
  // A half turn perpendicular to the forearm has no defined twist share
  // (swingTwist returns the exact identity then): nothing moves to the mid joint.
  if (twist.w === 1 && twist.x === 0 && twist.y === 0 && twist.z === 0)
    return pose;
  const current: IAutoMovieJointPose = pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === props.chain.lower,
  ) ?? { bone: props.chain.lower, flexion: null, abduction: null, twist: null };
  const articulated: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      jointToQuaternion(
        current,
        lowerAxes,
        props.restFrames?.[props.chain.lower],
      ),
      twist,
    ),
  );
  const angles: ReturnType<typeof decomposeJointRotation> =
    decomposeJointRotation(
      articulated,
      lowerAxes,
      props.restFrames?.[props.chain.lower],
      {
        bone: props.chain.lower,
        constraint: getConstraint(
          props.chain.lower,
          props.skeleton.bones.find(
            (b): boolean => b.bone === props.chain.lower,
          )?.constraint ?? null,
        ),
      },
    );
  const lower: IAutoMovieJointPose = clampJointToSkeleton(
    {
      bone: props.chain.lower,
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
        (j: IAutoMovieJointPose): boolean => j.bone !== props.chain.lower,
      ),
      lower,
    ],
  };
}
