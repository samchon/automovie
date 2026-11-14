import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { resolveBoneMap } from "./resolveBoneMap";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * Give a distally twisting mid bone (a forearm, which pronates and supinates
 * about its own length beyond the elbow's hinge) the twist its effector
 * cannot take, so the wrist keeps only the flexion and deviation it can make.
 *
 * The mid joint's twist is solved from its current twist as the root of the
 * twist the effector would be left with in its own clinical convention
 * (`solveDistalTwist`), clamped to the rig's range: only the residual beyond
 * the current pose moves to the forearm, and a rotation the forearm and the
 * wrist can reach together is reached exactly. A twist about the bone's own
 * length leaves the effector's joint where it is, so the effector stays on its
 * target. Bones without a distal twist are returned unchanged.
 *
 * @param props The fit request.
 * @param axes Merged joint axes.
 * @param pose The fitted pose.
 * @param rotation The requested effector rotation.
 * @returns The pose with the mid bone's twist set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves to the mid joint, from where, the clamp and why the effector stays.
 * @evidence contracts/development/implementation.md#principled-implementation The mid bone's world rotation is its parent's frame times its articulation, so the frame its articulation composes after is read once and the twist solved on it by `solveDistalTwist`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics and one solve.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A twist past the range is clamped, leaving its excess to the effector's clamp and the reported residual.
 * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics pass, linear in bones, and the solve's few compositions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The solve is the one the limb fit's ranking reads (`fitHingedChainCandidate`).
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
  const current: IAutoMovieJointPose = pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === props.chain.lower,
  ) ?? { bone: props.chain.lower, flexion: null, abduction: null, twist: null };
  const lowerBasis: IAutoMovieJointAxes = normalizeJointAxes(
    lowerAxes,
    "splitDistalTwist axes",
  );
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];

  // The mid bone's world rotation is the frame its articulation composes
  // after times that articulation.
  const above: IAutoMovieQuaternion = Quaternion.multiply(
    world.worldRotation,
    Quaternion.inverse(
      jointToQuaternionOnBasis(current, lowerBasis, lowerFrame),
    ),
  );
  const lower: IAutoMovieJointPose = solveDistalTwist({
    joint: current,
    effector: pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === props.chain.effector,
    ) ?? {
      bone: props.chain.effector,
      flexion: null,
      abduction: null,
      twist: null,
    },
    above,
    lowerBasis,
    lowerFrame,
    effectorRest:
      props.skeleton.bones.find(
        (b: (typeof props.skeleton.bones)[number]): boolean =>
          b.bone === props.chain.effector,
      )?.rest.rotation ?? Quaternion.identity(),
    effectorBasis: normalizeJointAxes(
      axes[props.chain.effector] ?? DEFAULT_JOINT_AXES,
      "splitDistalTwist axes",
    ),
    effectorFrame: props.restFrames?.[props.chain.effector],
    rotation,
    skeleton: props.skeleton,
  });
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
