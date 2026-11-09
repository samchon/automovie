import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  clampPose,
  fitChainToTarget,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * Resolve a posture into a canonical pose: the root from the posture's
 * position and heading, every directly set joint, then each limb goal by the
 * engine's two-bone fit with its bend hint, arms after the trunk and legs
 * after the root, and finally the rig's range of motion.
 *
 * Bones a posture neither sets nor solves stand at clinical zero, so every
 * pose this returns lists every rig bone and reads the same on any renderer.
 * The limb fit is `fitChainToTarget`, which clamps its candidates to the
 * rig's range of motion and searches bend planes when the hinted one misses;
 * the whole pose is then clamped by `clampPose`, so no returned angle exceeds
 * the rig's declared range.
 *
 * @param body The performer's body.
 * @param posture The posture.
 * @param base A pose whose joints replace clinical zero for unset bones, such
 *   as a transition's displayed pose; its root is ignored.
 * @returns The canonical pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, the default for unset bones, the IK owner and the final clamp.
 * @evidence contracts/development/implementation.md#principled-implementation Root, then forward joints, then two-bone IK per limb with a pole hint (the engine's fitChainToTarget), then the range-of-motion clamp: the standard procedural order where IK runs on the already posed parents.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose assembly, one fit per goal, one clamp.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle is set past the rig's range; an unreachable goal leaves the limb extended toward it, reported by the audits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones plus up to four limb fits, each a bounded bend search.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; the body's topology is shared.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveHumanPosture(
  body: IHumanBody,
  posture: IHumanPosture,
  base?: IAutoMoviePose,
): IAutoMoviePose {
  const kept: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    (base?.joints ?? []).map((j: IAutoMovieJointPose): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j]),
  );
  const joints: IAutoMovieJointPose[] = body.skeleton.bones.map((b): IAutoMovieJointPose => {
    const set: readonly [number, number, number] | undefined = posture.joints[b.bone];
    if (set !== undefined) return { bone: b.bone, flexion: set[0], abduction: set[1], twist: set[2] };
    return kept.get(b.bone) ?? { bone: b.bone, flexion: 0, abduction: 0, twist: 0 };
  });
  let pose: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: { translation: posture.root, rotation: resolveHumanPosture.heading(posture), scale: { x: 1, y: 1, z: 1 } },
    joints,
  };
  for (const limb of ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
    const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
    if (goal === undefined) continue;
    pose = fitLimb(body, pose, limb, goal);
  }
  return clampPose(pose, body.skeleton);
}

/**
 * Companion helpers of {@link resolveHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each helper's convention.
 * @evidence contracts/development/implementation.md#principled-implementation Heading is yaw about +Y, then pitch about the turned +X, then roll about the turned +Z, the intrinsic order of a body turning, then leaning.
 */
export namespace resolveHumanPosture {
  /**
   * A posture's root rotation: yaw about +Y, then pitch about the turned
   * left axis (+X, a forward tip), then roll about the turned forward axis
   * (+Z, a tip toward the right).
   *
   * @param posture The posture's heading.
   * @returns The rotation.
   */
  export function heading(posture: Pick<IHumanPosture, "yaw" | "pitch" | "roll">): IAutoMovieQuaternion {
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, posture.yaw),
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, posture.pitch),
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, posture.roll),
        ),
      ),
    );
  }

  /**
   * Re-solve one limb of a pose onto a goal, keeping everything else.
   *
   * @param body The performer's body.
   * @param pose The pose.
   * @param limb The limb.
   * @param goal Its goal.
   * @returns The pose with the limb fitted.
   */
  export function limb(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb, goal: IHumanPosture.IGoal): IAutoMoviePose {
    return fitLimb(body, pose, limb, goal);
  }
}

/** The fit of one limb by the engine's two-bone solver. */
function fitLimb(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb, goal: IHumanPosture.IGoal): IAutoMoviePose {
  const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
  const arm: boolean = limb.endsWith("Arm");
  return fitChainToTarget({
    skeleton: body.skeleton,
    pose,
    chain: arm
      ? { upper: `${side}UpperArm`, lower: `${side}LowerArm`, effector: `${side}Hand` }
      : { upper: `${side}UpperLeg`, lower: `${side}LowerLeg`, effector: `${side}Foot` },
    target: goal.point,
    bend: goal.bend,
    ...(goal.rotation === undefined ? {} : { effectorRotation: goal.rotation }),
    topology: body.topology,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  });
}
