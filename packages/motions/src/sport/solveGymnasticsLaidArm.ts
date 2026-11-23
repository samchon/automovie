import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A wheel's laid arm (`GymnasticsWheelPlants`) solved on its laid goal at
 * the carried arm's own swivel and branch (`HumanLimbFit.seed` of the shown
 * pose, prescribed), so the solve keeps the elbow's side and the forearm's
 * turn the carried arm has and follows it continuously as the body turns;
 * returned as the joints the solve changes from the shown arm, which the
 * plants write as joints so no later fit of a goal chooses another turn of
 * the arm.
 *
 * @param body The body.
 * @param posture The carried posture, its limb goals unread.
 * @param shown The carried posture's resolved pose.
 * @param limb The arm.
 * @param goal The laid palm's arm goal.
 * @param digits The laid hand's finger joints.
 * @returns The changed joints, clinical degrees by bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seed, the solve, what is returned and why.
 * @evidence contracts/development/implementation.md#principled-implementation The swivel is the one free coordinate of a two-bone limb on its goal (Tolani, Goswami and Badler 2000, section 3.2.4); placing the laid arm at the carried arm's swivel keeps its branch.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One seed, one seeded resolve, one comparison.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint the solve leaves within a nanodegree of the shown one is not returned.
 * @evidence contracts/development/implementation.md#efficient-algorithms One seed read and one seeded resolve per call; the plants call it once per key.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The limb fit's seed and the resolver.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function solveGymnasticsLaidArm(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  shown: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  digits: IAutoMovieMotionHumanPosture["joints"],
): Map<AutoMovieHumanoidBone, readonly [number, number, number]> {
  const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(body, shown, limb);
  const solved: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    {
      ...posture,
      joints: { ...posture.joints, ...digits },
      limbs: { [limb]: goal },
    },
    undefined,
    seed === null
      ? {}
      : {
          [limb]: {
            ...seed,
            tolerance: hingedArmSwivel.RESOLUTION,
            prescribed: true,
          },
        },
  ).pose;
  const before: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    shown.joints.map(
      (j: IAutoMovieJointPose): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [
        j.bone,
        j,
      ],
    ),
  );
  const changed: Map<AutoMovieHumanoidBone, readonly [number, number, number]> =
    new Map();
  for (const at of solved.joints) {
    const was: IAutoMovieJointPose | undefined = before.get(at.bone);
    const to: readonly [number, number, number] = [
      at.flexion ?? 0,
      at.abduction ?? 0,
      at.twist ?? 0,
    ];
    if (
      Math.abs(to[0] - (was?.flexion ?? 0)) +
        Math.abs(to[1] - (was?.abduction ?? 0)) +
        Math.abs(to[2] - (was?.twist ?? 0)) >
      1e-9
    )
      changed.set(at.bone, to);
  }
  return changed;
}
