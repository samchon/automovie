import {
  HUMANOID_JOINT_AXES,
  armChainFault,
  importedNodeClipToAutoMovieMotion,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { importedNodeMotionTestClip as clip } from "../internal/importedNodeMotionTestClip";
import { importedNodeMotionTestSkeleton } from "../internal/importedNodeMotionTestSkeleton";
import { nclose } from "../internal/nclose";

/** Synthetic spine axes whose flexion turns about −X, the default's mirror. */
const NEGATED_SPINE: IAutoMovieJointAxes = {
  flexion: { x: -1, y: 0, z: 0 },
  abduction: { x: 0, y: 0, z: -1 },
  twist: { x: 0, y: 1, z: 0 },
};

/** Synthetic forearm axes whose flexion turns about Z, off a −Y forearm. */
const Z_ELBOW: IAutoMovieJointAxes = {
  flexion: { x: 0, y: 0, z: 1 },
  abduction: { x: 1, y: 0, z: 0 },
  twist: { x: 0, y: 1, z: 0 },
};

/**
 * Pins that the inverse paths read a bone's declared axes ahead of the host
 * table: the arm-chain diagnosis and the decomposition of an imported clip.
 *
 * The rigs and axes are synthetic test inputs, not anatomy.
 *
 * Scenarios:
 *
 * 1. An arm hanging along −Y faults under `HUMANOID_JOINT_AXES`, whose elbow
 *    flexes about Y, and stops faulting when the lower arm declares flexion
 *    about Z.
 * 2. A captured 90-degree turn of the spine about +X decomposes to flexion 90
 *    on the undeclared source rig and to flexion −90 when the spine declares
 *    flexion about −X.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls armChainFault and importedNodeClipToAutoMovieMotion on rigs with and without declared axes; an inverse path that ignored the declaration keeps the fault or the +90 reading.
 * @evidence contracts/testing.md#independent-expectations A Y hinge is parallel to a −Y forearm and a Z hinge is not; a turn about +X reads as +90 about +X and −90 about −X by the right-hand rule.
 * @evidence contracts/testing.md#distinguishing-cases Each scenario pairs the undeclared rig with the declared one; forward resolution and baking belong to the declared-axes kinematics entry, and the chain IK and retargeting read the same `skeletonJointAxes` table without their own case here.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous kinematics unit entry over in-memory rigs and the shared imported-clip fixtures, calling engine source without a viewer, GPU or installed asset.
 */
export function test_kinematics_bone_declared_axes_inverse(): void {
  // 1. the arm-chain diagnosis
  TestValidator.equals(
    "a hanging arm faults only without the declaration",
    [
      armChainFault(hangingArm(false), "left") !== null,
      armChainFault(hangingArm(true), "left", HUMANOID_JOINT_AXES),
    ],
    [true, null],
  );

  // 2. imported clip decomposition
  const flexion: (skeleton: IAutoMovieSkeleton) => number = (
    skeleton: IAutoMovieSkeleton,
  ): number => {
    const motion: IAutoMovieMotion = importedNodeClipToAutoMovieMotion({
      clip: clip(),
      sourceSkeleton: skeleton,
      mapping: [
        { node: "spine-node", bone: "spine" },
        { node: "pelvis-node", bone: "hips" },
      ],
      motionId: "declared",
    });
    return motion.keyframes[1]!.pose.joints.find(
      (joint: IAutoMovieJointPose): boolean => joint.bone === "spine",
    )!.flexion!;
  };
  const source: IAutoMovieSkeleton = importedNodeMotionTestSkeleton();
  const declared: IAutoMovieSkeleton = {
    ...source,
    bones: source.bones.map(
      (bone: IAutoMovieBone): IAutoMovieBone =>
        bone.bone === "spine" ? { ...bone, axes: NEGATED_SPINE } : bone,
    ),
  };
  TestValidator.predicate(
    "the spine turn reads +90 undeclared and −90 declared",
    nclose(flexion(source), 90, 1e-9) && nclose(flexion(declared), -90, 1e-9),
  );
}

/** A left arm hanging along −Y, optionally declaring a Z elbow. */
function hangingArm(declare: boolean): IAutoMovieSkeleton {
  const bone: (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    y: number,
    axes?: IAutoMovieJointAxes,
  ) => IAutoMovieBone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    y: number,
    axes?: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x: 0, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
    ...(declare && axes !== undefined ? { axes } : {}),
  });
  return {
    id: "hanging",
    bones: [
      bone("hips", null, 1),
      bone("leftUpperArm", "hips", 0.5),
      bone("leftLowerArm", "leftUpperArm", -0.3, Z_ELBOW),
      bone("leftHand", "leftLowerArm", -0.25),
    ],
  };
}
