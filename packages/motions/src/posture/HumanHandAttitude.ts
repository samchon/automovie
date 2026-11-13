import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  clampJointToSkeleton,
  decomposeJointRotation,
  getConstraint,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "./HumanHand";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A hand held at a world attitude on the arm as it stands: what a carried or
 * lifted object's attitude asks of the hand, solved at the wrist alone.
 *
 * The arm's upper arm and forearm stay as the posture places them, the
 * forearm's twist included, and the wrist takes the rest: its local turn is
 * the forearm's world rotation and the hand's rest undone from the asked
 * rotation, read back as clinical angles on the chart inside the wrist's
 * range and clamped to it
 * (the engine's decomposition and clamp, the last step of every limb fit).
 * The forearm's twist is not moved, since a small change of the hand's
 * attitude is a small turn of the wrist, while the engine's distal-twist
 * split hands the forearm a share of the whole rotation from its rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what stays, what moves, how it is solved and why the forearm's twist is left.
 * @evidence contracts/development/design.md#principled-representation An attitude is a world rotation of the hand; the arm as placed is the frame it is solved in.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One solve, read by the arm's carry and by a pick-up's lift, so both hold an object's attitude the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The decomposition and the clamp are the engine's; no angle is set past the rig's range.
 */
export namespace HumanHandAttitude {
  /**
   * The posture with the arm written as joints, the hand turned to a world
   * rotation at the wrist where the arm stands.
   *
   * @param body The body.
   * @param posture The posture; the arm is placed by its joints or its goal.
   * @param side The hand.
   * @param rotation The hand's world rotation asked.
   * @returns The posture with that arm's joints set and its goal removed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the solve and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's local rotation is the forearm's world rotation and the hand's rest undone from the asked one, decomposed on the hand's joint axes, read on the equivalent chart inside its range, and clamped to it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve of the posture, one decomposition and one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rotation the wrist cannot reach is clamped by the rig's range, never reported as reached.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve and one forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the resolver, `poseBones` and the engine's `decomposeJointRotation` and `clampJointToSkeleton`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function held(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    rotation: IAutoMovieQuaternion,
  ): IHumanPosture {
    const upper: AutoMovieHumanoidBone = `${side}UpperArm`;
    const lower: AutoMovieHumanoidBone = `${side}LowerArm`;
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const rest: IAutoMovieQuaternion =
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === hand)
        ?.rest.rotation ?? Quaternion.identity();
    const local: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.inverse(rest),
        Quaternion.multiply(
          Quaternion.inverse(bones.get(lower)!.worldRotation),
          rotation,
        ),
      ),
    );
    const angles: ReturnType<typeof decomposeJointRotation> =
      decomposeJointRotation(
        local,
        skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES)[hand],
        HUMANOID_REST_FRAME[hand],
        // The reading of the rotation inside the wrist's range, of its two
        // equivalent charts, so the clamp does not turn a reachable hand.
        {
          bone: hand,
          constraint: getConstraint(
            hand,
            body.skeleton.bones.find(
              (b: IAutoMovieBone): boolean => b.bone === hand,
            )?.constraint ?? null,
          ),
        },
      );
    const wrist: IAutoMovieJointPose = clampJointToSkeleton(
      {
        bone: hand,
        flexion: angles.flexion,
        abduction: angles.abduction,
        twist: angles.twist,
      },
      body.skeleton,
    );
    const read = (bone: AutoMovieHumanoidBone): [number, number, number] => {
      const joint: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        [upper]: read(upper),
        [lower]: read(lower),
        [hand]: [wrist.flexion ?? 0, wrist.abduction ?? 0, wrist.twist ?? 0],
      },
      limbs,
    };
  }
}
