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
  IAutoMovieVector3,
} from "@automovie/interface";

import { handReach } from "../everyday/handReach";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A wheel's laid arm (`GymnasticsWheelPlants`) solved on its laid goal at the
 * carried arm's own swivel and branch (`HumanLimbFit.seed` of the shown pose,
 * prescribed), so the solve keeps the elbow's side and the forearm's turn the
 * carried arm has and follows it continuously as the body turns; returned as
 * the joints the solve changes from the shown arm, which the plants write as
 * joints so no later fit of a goal chooses another turn of the arm.
 *
 * @param body The body.
 * @param posture The carried posture, its limb goals unread.
 * @param shown The carried posture's resolved pose.
 * @param limb The arm.
 * @param goal The laid palm's arm goal.
 * @param digits The laid hand's finger joints.
 * @returns The changed joints, clinical degrees by bone.
 */
export function solveGymnasticsLaidArm(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  shown: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  digits: IAutoMovieMotionHumanPosture["joints"],
): Map<AutoMovieHumanoidBone, readonly [number, number, number]> {
  const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
    body,
    shown,
    limb,
  );
  const laid: IAutoMovieMotionHumanPosture = {
    ...posture,
    joints: { ...posture.joints, ...digits },
  };
  // The palm is laid by its surface point; the hand's own colliders reach a
  // little past that surface at its heel and borders, by the laid hand's own
  // depth along the floor's normal (`handReach`, read in the hand's frame at
  // the goal's turn), so the goal is laid that much higher before its one
  // solve: the hand rests on the floor, never in it.
  const depth: number =
    goal.rotation === undefined
      ? 0
      : Math.max(
          0,
          handReach(
            body,
            { ...laid, limbs: {} },
            limb === "leftArm" ? "left" : "right",
            goal.rotation,
            "palm",
            "flat",
          )(DOWN),
        );
  const solved: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    {
      ...laid,
      limbs: {
        [limb]:
          depth > 0
            ? { ...goal, point: { ...goal.point, y: goal.point.y + depth } }
            : goal,
      },
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
      (
        j: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
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

/** The floor's inward normal, world: straight down. */
const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
