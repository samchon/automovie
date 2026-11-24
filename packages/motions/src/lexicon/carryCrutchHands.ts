import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";

/**
 * Carry each hand that grips a moving crutch from the support course onto the
 * crutch's own track.
 *
 * A support sequence solves its keys with each hand on its crutch's grip where
 * the crutch stands at that key, and between two keys it lays the held hand's
 * goal on a minimum-jerk chord from one key's grip to the next
 * (`prepareSupportInterval`). A crutch advancing between those keys travels its
 * own course instead (lifted clear of the floor, or up and over a nosing), so
 * the law hands this function, per side, the crutch grip's offset from that
 * chord at the current second, and the hand's goal and elbow pole are
 * translated by it: the hand stays on the grip it holds, and at each key, where
 * the offset is zero, the posture is the support's own. The goal is only the
 * hand's place; the arms that reach it are laid as one course over the action
 * (`carryCrutchHands.coursed`).
 *
 * @param posture The support sequence's posture at a second.
 * @param offset Per side, the crutch grip's world offset from the support chord
 *   at that second in metres, zero where the crutch stands still.
 * @returns The posture with each carried hand's goal on its crutch's grip; the
 *   same posture when no hand moves.
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

/** Companion of `carryCrutchHands`: the grip arms laid as one course. */
export namespace carryCrutchHands {
  /** A crutch law's plan whose posture writes both hands on their grips. */
  export interface ICoursed {
    /** The action's context: its body and the arms it is entered with. */
    context: IAutoMovieMotionHumanActionContext;

    /**
     * The law's plan, whose posture writes each hand's goal on its crutch's
     * grip (`carryCrutchHands`) from `ready` to its end.
     */
    plan: IAutoMovieMotionHumanActionPlan;

    /** When the hands are on the grips, seconds since the action's start. */
    ready: number;
  }

  /**
   * Both grip arms laid as one course over the hold (`courseArmGoal`, the right
   * arm `with` the left as one trajectory problem): from `ready`, where the
   * course takes over from the arms the display shows, to the action's end,
   * with the hands on the grips throughout. The hold is fitted frame by frame,
   * each frame continuing the swivel and branch the frame before chose (Tolani,
   * Goswami and Badler 2000, section 3.2.4, the feasible swivel nearest the
   * previous one), and admitted or optimised as one trajectory, so the arms
   * keep one course across the support's keys, where a fit of each posture
   * alone may take another elbow path (transitions.md "Pose by time": the path
   * is prepared once and read as a function of time).
   *
   * @param props The context, the plan and when the hands are on the grips.
   * @returns The plan with both arms written by their course.
   * @throws {HumanRefusal} When no course of the arms meets the trajectory's
   *   constraints (`courseArmGoal`).
   */
  export function coursed(props: ICoursed): IAutoMovieMotionHumanActionPlan {
    const duration: number = props.plan.duration;
    const ready: number = props.ready;
    return courseArmGoal({
      context: props.context,
      plan: props.plan,
      side: "left",
      span: { start: ready, ready, relax: duration, end: duration },
      with: [{ side: "right" }],
    });
  }
}
