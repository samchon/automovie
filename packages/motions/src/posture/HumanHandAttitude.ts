import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
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
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "./HumanHand";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A hand held at a world attitude on the arm as it stands: what a carried or
 * lifted object's attitude asks of the hand.
 *
 * The upper arm stays as the posture places it. The wrist takes the asked
 * rotation first: its local turn is the forearm's world rotation and the
 * hand's rest undone from it, read back as clinical angles on the chart
 * inside the wrist's range and clamped to it (the engine's decomposition and
 * clamp, the last step of every limb fit). The wrist has no turn about the
 * forearm's length, so what the clamp leaves of that turn, the twist of the
 * residual about the forearm's axis (a swing-twist split), is added to the
 * forearm's own twist, clamped to its range, and the wrist is solved again
 * on the turned forearm. The forearm moves only by that residual, from its
 * current twist: the engine's distal-twist split hands the forearm a share
 * of the whole rotation from its rest instead, and a 14-degree swing asked
 * of a carried glass turned the forearm from -29 to its +90 end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what stays, what moves first, what the forearm takes and why from its current twist.
 * @evidence contracts/development/design.md#principled-representation An attitude is a world rotation of the hand; the arm as placed is the frame it is solved in.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One solve, read by the arm's carry and by a pick-up's lift, so both hold an object's attitude the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The decomposition and the clamps are the engine's; no angle is set past the rig's range.
 */
export namespace HumanHandAttitude {
  /**
   * The posture with the arm written as joints, the hand turned to a world
   * rotation where the arm stands: the wrist first, the forearm's twist by
   * what the wrist cannot turn about the forearm's length.
   *
   * @param body The body.
   * @param posture The posture; the arm is placed by its joints or its goal.
   * @param side The hand.
   * @param rotation The hand's world rotation asked.
   * @returns The posture with that arm's joints set and its goal removed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the order of the solve and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's local rotation decomposed on its chart inside its range and clamped; the residual's twist about the forearm's axis, converted to the forearm's clinical twist by its rate read off the rig, added to the current twist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A wrist solve, one twist share and a second wrist solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both joints are clamped by the rig's range; what neither can turn stays a residual, never reported as reached.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve and four forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the resolver, `poseBones` and the engine's `decomposeJointRotation`, `getConstraint` and `clampJointToSkeleton`.
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
    const read = (bone: AutoMovieHumanoidBone): [number, number, number] => {
      const joint: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const written = (
      forearm: readonly [number, number, number],
      wrist: readonly [number, number, number],
    ): IHumanPosture => ({
      ...posture,
      joints: {
        ...posture.joints,
        [upper]: read(upper),
        [lower]: forearm,
        [hand]: wrist,
      },
      limbs,
    });
    const bones = (
      at: IHumanPosture,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(body, resolveHumanPosture(body, at));
    const forearm: [number, number, number] = read(lower);
    const first: [number, number, number] = wrist(
      body,
      hand,
      bones(written(forearm, read(hand))).get(lower)!.worldRotation,
      rotation,
    );

    // What the wrist leaves of the turn about the forearm's length.
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      written(forearm, first),
    );
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        shown.get(hand)!.worldPosition,
        shown.get(lower)!.worldPosition,
      ),
    );
    const left: number = twist(
      Quaternion.multiply(
        rotation,
        Quaternion.inverse(shown.get(hand)!.worldRotation),
      ),
      along,
    );
    if (!(Math.abs(left) > 1e-3)) return written(forearm, first);

    // The forearm's clinical twist per degree about its axis, read off the
    // rig, and the forearm turned by the residual, clamped to its range.
    const nudged: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      written([forearm[0], forearm[1], forearm[2] + 1], first),
    );
    const rate: number = twist(
      Quaternion.multiply(
        nudged.get(hand)!.worldRotation,
        Quaternion.inverse(shown.get(hand)!.worldRotation),
      ),
      along,
    );
    if (!(Math.abs(rate) > 1e-6)) return written(forearm, first);
    const turned: IAutoMovieJointPose = clampJointToSkeleton(
      {
        bone: lower,
        flexion: forearm[0],
        abduction: forearm[1],
        twist: forearm[2] + left / rate,
      },
      body.skeleton,
    );
    const next: [number, number, number] = [
      forearm[0],
      forearm[1],
      turned.twist ?? forearm[2],
    ];
    return written(
      next,
      wrist(
        body,
        hand,
        bones(written(next, first)).get(lower)!.worldRotation,
        rotation,
      ),
    );
  }
}

/** The wrist's clinical angles that turn the hand to a world rotation under a forearm's world rotation: the local turn decomposed on the chart inside the wrist's range and clamped to it. */
function wrist(
  body: IHumanBody,
  hand: AutoMovieHumanoidBone,
  forearm: IAutoMovieQuaternion,
  rotation: IAutoMovieQuaternion,
): [number, number, number] {
  const rest: IAutoMovieQuaternion =
    body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === hand)
      ?.rest.rotation ?? Quaternion.identity();
  const angles: ReturnType<typeof decomposeJointRotation> =
    decomposeJointRotation(
      Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.inverse(rest),
          Quaternion.multiply(Quaternion.inverse(forearm), rotation),
        ),
      ),
      skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES)[hand],
      HUMANOID_REST_FRAME[hand],
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
  const joint: IAutoMovieJointPose = clampJointToSkeleton(
    {
      bone: hand,
      flexion: angles.flexion,
      abduction: angles.abduction,
      twist: angles.twist,
    },
    body.skeleton,
  );
  return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
}

/** The turn of a rotation about a unit axis, degrees in (-180, 180]: the twist of its swing-twist split. */
function twist(q: IAutoMovieQuaternion, axis: IAutoMovieVector3): number {
  const n: IAutoMovieQuaternion = Quaternion.normalize(q);
  const sign: number = n.w < 0 ? -1 : 1;
  return (
    (2 *
      Math.atan2(
        sign * (n.x * axis.x + n.y * axis.y + n.z * axis.z),
        sign * n.w,
      ) *
      180) /
    Math.PI
  );
}
