import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Carry each hand that grips a moving crutch from the support course onto the
 * crutch's own track.
 *
 * A support sequence solves its keys with each hand on its crutch's grip
 * where the crutch stands at that key, and between two keys it lays the held
 * hand's goal on a minimum-jerk chord from one key's grip to the next
 * (`prepareSupportInterval`). A crutch advancing between those keys travels
 * its own course instead (lifted clear of the floor, or up and over a
 * nosing), so the law hands this function, per side, the crutch grip's offset
 * from that chord at the current second, and the hand's goal and elbow pole
 * are translated by it: the hand stays on the grip it holds, and at each key,
 * where the offset is zero, the posture is the support's own.
 *
 * @param posture The support sequence's posture at a second.
 * @param offset Per side, the crutch grip's world offset from the support chord at that second in metres, zero where the crutch stands still.
 * @returns The posture with each carried hand's goal on its crutch's grip; the same posture when no hand moves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chord the support course lays, what the offset is, its unit and frame, and that keys are left unchanged.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid translation of a held arm goal and its pole by the grip's displacement keeps the hand's rotation and its grip on the crutch; the offset vanishes at the keys, so the course stays continuous.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The law owns its crutch track and computes the offset; this function only applies it to the arm goals the support course wrote.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hand place is authored apart from the crutch's track; an arm with no held goal is left to the support course.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two offset reads and at most two goal copies per posture.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is one posture's own; nothing is shared across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after returning.
 */
export function carryCrutchHands(
  posture: IAutoMovieMotionHumanPosture,
  offset: (side: AutoMovieHumanSide) => IAutoMovieVector3,
): IAutoMovieMotionHumanPosture {
  let limbs: IAutoMovieMotionHumanPosture["limbs"] = posture.limbs;
  for (const side of ["left", "right"] as const) {
    const arm: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
    const goal: IAutoMovieHumanLimbGoal | undefined = limbs[arm];
    if (goal === undefined) continue;
    const by: IAutoMovieVector3 = offset(side);
    if (by.x === 0 && by.y === 0 && by.z === 0) continue;
    limbs = {
      ...limbs,
      [arm]: {
        ...goal,
        point: Vector3.add(goal.point, by),
        ...(goal.bend === undefined
          ? {}
          : { bend: Vector3.add(goal.bend, by) }),
      },
    };
  }
  return limbs === posture.limbs ? posture : { ...posture, limbs };
}
