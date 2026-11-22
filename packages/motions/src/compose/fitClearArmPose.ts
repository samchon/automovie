import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { courseArmGoal } from "./courseArmGoal";

/**
 * Whether one posture's arm goals have a clear arm pose, judged by the arm
 * planner itself: the posture's goals for the arm (and for a second arm on
 * the same implement) are laid as a one-instant course (`courseArmGoal`)
 * whose hold is the goal, every term of the goal hard (its working point,
 * its face, its limits) and the planner's clearance against the body the
 * judge. Either the planner admits a pose, and its arms are the answer, or
 * it refuses, and its refusal, which names what holds the arm off, is the
 * answer "no clear pose here".
 *
 * The course holds the goal from the action's start (`ready` at `start`)
 * for one frame step (`STEP`), the shortest span the planner lays, so no
 * reach is searched or judged: only where the arm can be decides. The hold
 * is seeded from the arms the posture's own limb fit gives, which reach the
 * goal but may pass through the body; the planner moves them clear or
 * refuses. The answer is read from the coursed posture at the end of the
 * span, never from the request (`courseArmGoal.goals`).
 *
 * A caller that places the body searches on this verdict (a stroke's
 * address moves the stance until its contact pose is clear); a law never
 * catches the refusal to carry on.
 *
 * @param props The body, the posture whose limbs write the arms' goals, the arm, and the second arm with its grasp.
 * @returns The verdict: clear with the coursed posture, or refused with the planner's refusal.
 * @throws {Error} When the posture writes no goal for a coursed arm, or a failure other than the planner's refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is judged, by whom, why the span holds from its start, what seeds it, where the answer is read and who searches on it.
 * @evidence contracts/development/implementation.md#principled-implementation The clearance verdict is the arm planner's own (`courseArmGoal`, `HumanArmTrajectory`), the same that lays the action's course, so a pose found clear here is laid by the action the same way; a hold from the first instant is joined to its rest without a reach (`AutoMovieMotionHumanArmPlanned`), so the verdict is the pose's alone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One limb fit for the seed, one constant plan, one course, one read at the span's end.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the planner's refusal is the verdict "refused"; every other error propagates, and the goal is never loosened.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve and one course of a one-step hold per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the seed to `resolveHumanPosture`, the solve to `courseArmGoal` and the rest angles to `AutoMovieMotionHumanArm.angles`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call but the coursed posture it returns.
 */
export function fitClearArmPose(
  props: fitClearArmPose.IProps,
): fitClearArmPose.Verdict {
  for (const side of props.second === undefined
    ? [props.side]
    : [props.side, props.second])
    if (props.posture.limbs[`${side}Arm`] === undefined)
      throw new Error(`The posture writes no ${side}Arm goal to fit`);
  const seed: IAutoMoviePose = resolveHumanPosture(props.body, props.posture);
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration: fitClearArmPose.STEP,
    events: [],
    contacts: [],
    posture: (): IAutoMovieMotionHumanPosture => props.posture,
  };
  try {
    const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
      body: props.body,
      plan,
      side: props.side,
      rest: AutoMovieMotionHumanArm.angles(seed, props.side),
      span: {
        start: 0,
        ready: 0,
        relax: fitClearArmPose.STEP,
        end: fitClearArmPose.STEP,
      },
      ...(props.grasp === undefined ? {} : { grasp: props.grasp }),
      ...(props.second === undefined
        ? {}
        : {
            with: [
              {
                side: props.second,
                rest: AutoMovieMotionHumanArm.angles(seed, props.second),
                ...(props.grasp === undefined ? {} : { grasp: props.grasp }),
              },
            ],
          }),
    });
    return {
      clear: true,
      posture: coursed.posture(fitClearArmPose.STEP),
    };
  } catch (error) {
    if (error instanceof HumanRefusal) return { clear: false, refusal: error };
    throw error;
  }
}

/** Companion types and constants of `fitClearArmPose`. */
export namespace fitClearArmPose {
  /**
   * The hold's span, seconds: one frame of the 120 Hz grid the planner
   * admits on.
   */
  export const STEP: number = 1 / 120;

  /**
   * What a clear pose is fitted to.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture to judge, whose limbs write each coursed arm's goal: its working point, its face and its limits. */
    posture: IAutoMovieMotionHumanPosture;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** The other arm on the same implement, laid in the same course; none when absent. */
    second?: AutoMovieHumanSide;

    /** The segments of each hand that close on the shared implement, excused from each other; none when absent. */
    grasp?: IAutoMovieMotionHumanArmCarry.ICarry["grasp"];
  }

  /**
   * A clear pose: the planner admits the goals.
   */
  export interface IClear {
    /** The goals have a clear pose. */
    clear: true;

    /** The posture with the coursed arms at the hold. */
    posture: IAutoMovieMotionHumanPosture;
  }

  /**
   * No clear pose: the planner refuses the goals.
   */
  export interface IRefused {
    /** The goals have no clear pose. */
    clear: false;

    /** The planner's refusal. */
    refusal: HumanRefusal;
  }

  /** The planner's verdict on one posture's arm goals. */
  export type Verdict = IClear | IRefused;
}
