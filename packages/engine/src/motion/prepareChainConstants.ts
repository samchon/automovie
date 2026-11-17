import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { getConstraint } from "../rom/getConstraint";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";

/**
 * What a parent-child two-bone chain's articulation-free frames depend on
 * in the rig alone, read once for a rig and placed under any pose by
 * `placeChainPlant`.
 *
 * `prepareChainPlant` recovers the same values from forward kinematics of
 * the pose with the chain's two joints left out: with no articulation, the
 * mid bone stands at its rest translation and rotation in the root bone's
 * frame and the end bone at its own in the mid bone's, whatever the pose
 * above the chain. Only the chain root's parent frame comes from the pose.
 *
 * @param props The rig, the chain and the clinical axes the fit reads.
 * @returns The constants; null when a bone is missing or the chain is not parent to child twice (a chain with a fixed bone between two of its own keeps `prepareChainPlant`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is constant, why, what still comes from the pose and when the result is null.
 * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics composes a child's rest transform on its parent's world frame, so with identity articulation the chain's relative frames are its bones' rest transforms and its ranges are the rig's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three bone lookups, the adjacency test, then one record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A chain the premise does not hold for returns null rather than an approximation; ranges come from `getConstraint` on the actual rig.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the bones for a rig and chain, in place of one forward-kinematics read of the whole pose per fit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One record serves every pose and target of the unchanged rig.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record copies its vectors and rotations and borrows the rig's constraint records, living as long as its owner keeps it.
 */
export function prepareChainConstants(props: {
  /** The rig, unchanged for the record's life. */
  skeleton: IAutoMovieSkeleton;

  /** The chain: its root, mid and end bones. */
  chain: IAutoMoviePlantChain;

  /** The merged clinical axes the fit reads the mid joint's hinge by. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
}): prepareChainConstants.IConstants | null {
  const { chain }: typeof props = props;
  let upper: IAutoMovieBone | undefined;
  let lower: IAutoMovieBone | undefined;
  let effector: IAutoMovieBone | undefined;
  for (const bone of props.skeleton.bones)
    if (bone.bone === chain.upper) upper = bone;
    else if (bone.bone === chain.lower) lower = bone;
    else if (bone.bone === chain.effector) effector = bone;
  if (upper === undefined || lower === undefined || effector === undefined) return null;
  if (lower.parent !== chain.upper || effector.parent !== chain.lower) return null;
  return {
    chain,
    parent: upper.parent,
    upperTranslation: { ...upper.rest.translation },
    upperRotation: { ...upper.rest.rotation },
    lowerOffset: { ...lower.rest.translation },
    lowerRotation: { ...lower.rest.rotation },
    effectorOffset: { ...effector.rest.translation },
    effectorBaseRotation: { ...effector.rest.rotation },
    hinge: normalizeJointAxes(
      props.jointAxes?.[chain.lower] ?? DEFAULT_JOINT_AXES,
      "prepareChainConstants axes",
    ).flexion,
    upperDomain: {
      bone: chain.upper,
      constraint: getConstraint(chain.upper, upper.constraint ?? null),
    },
    lowerDomain: {
      bone: chain.lower,
      constraint: getConstraint(chain.lower, lower.constraint ?? null),
    },
  };
}

/**
 * The record of {@link prepareChainConstants}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
 * @evidence contracts/development/design.md#principled-representation Rest translations in metres and rest rotations as quaternions, each in its parent bone's frame, with the two joints' ranges.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `placeChainPlant` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose-dependent value is kept.
 */
export namespace prepareChainConstants {
  /**
   * A chain's rig constants.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
   * @evidence contracts/development/design.md#principled-representation The chain's relative rest frames and ranges.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eleven members, all read by the placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing here depends on a pose.
   */
  export interface IConstants {
    /** The chain. */
    chain: IAutoMoviePlantChain;

    /** The root bone's parent; null when the root bone hangs from the pose's root. */
    parent: AutoMovieHumanoidBone | null;

    /** The root bone's rest translation in its parent's frame, metres. */
    upperTranslation: IAutoMovieVector3;

    /** The root bone's rest rotation in its parent's frame. */
    upperRotation: IAutoMovieQuaternion;

    /** The mid bone's place in the root bone's frame, metres. */
    lowerOffset: IAutoMovieVector3;

    /** The mid bone's rest rotation in the root bone's frame. */
    lowerRotation: IAutoMovieQuaternion;

    /** The end bone's place in the mid bone's frame, metres. */
    effectorOffset: IAutoMovieVector3;

    /** The end bone's rest rotation in the mid bone's frame. */
    effectorBaseRotation: IAutoMovieQuaternion;

    /** The mid joint's hinge axis in the mid bone's frame, unit. */
    hinge: IAutoMovieVector3;

    /** The root joint's range. */
    upperDomain: IAutoMovieJointRotationDomain;

    /** The mid joint's range. */
    lowerDomain: IAutoMovieJointRotationDomain;
  }
}
