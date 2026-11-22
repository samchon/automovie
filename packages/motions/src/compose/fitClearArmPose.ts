import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
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
 * refuses. A caller whose action reaches the goal from a known pose over a
 * known time and returns to it (`reach`) has the hold reached instead: from
 * the arms of that pose, over that time, held on its one instant and returned, paced as a minimum-jerk movement over it, so the
 * planner searches the hold's configurations from its own starts as the
 * action's course does, and a pose the limb fit cannot turn into is still
 * found. The answer is read from the coursed posture at the end of the span,
 * never from the request (`courseArmGoal.goals`).
 *
 * A caller that places the body searches on this verdict (a stroke's
 * address moves the stance until its contact pose is clear); a law never
 * catches the refusal to carry on.
 *
 * @param props The body, the posture whose limbs write the arms' goals, the arm, the second arm with its grasp, and the reach that comes to the hold.
 * @returns The verdict: clear with the coursed posture, or refused with the planner's refusal.
 * @throws {Error} When the posture writes no goal for a coursed arm, or a failure other than the planner's refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is judged, by whom, why the span holds from its start or is reached, what seeds it, where the answer is read and who searches on it.
 * @evidence contracts/development/implementation.md#principled-implementation The clearance verdict is the arm planner's own (`courseArmGoal`, `HumanArmTrajectory`), the same that lays the action's course, so a pose found clear here is laid by the action the same way; a hold from the first instant is joined to its rest without a reach (`AutoMovieMotionHumanArmPlanned`), so the verdict is the pose's alone; a stated reach is the action's own, its pace the minimum-jerk peak, 15/8 of the mean speed over the distance it covers.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One limb fit for the seed, one constant plan, one course, one read at the span's end.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the planner's refusal is the verdict "refused"; every other error propagates, and the goal is never loosened.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve and one course of a one-step hold per call, or one reached course and one forward kinematics of the entry's wrists.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the seed to `resolveHumanPosture`, the solve to `courseArmGoal` and the rest angles to `AutoMovieMotionHumanArm.angles`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call but the coursed posture it returns.
 */
export function fitClearArmPose(
  props: fitClearArmPose.IProps,
): fitClearArmPose.Verdict {
  const sides: readonly AutoMovieHumanSide[] =
    props.second === undefined ? [props.side] : [props.side, props.second];
  const goal = (side: AutoMovieHumanSide): IAutoMovieHumanLimbGoal => {
    const found: IAutoMovieHumanLimbGoal | undefined =
      props.posture.limbs[`${side}Arm`];
    if (found === undefined)
      throw new Error(`The posture writes no ${side}Arm goal to fit`);
    return found;
  };
  for (const side of sides) goal(side);
  const reach: fitClearArmPose.IReach | undefined = props.reach;
  const seed: IAutoMoviePose =
    reach?.entry ?? resolveHumanPosture(props.body, props.posture);
  const ready: number = reach?.seconds ?? 0;
  const relax: number = reach === undefined ? fitClearArmPose.STEP : ready;
  const end: number =
    reach === undefined ? fitClearArmPose.STEP : ready + reach.back;
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration: end,
    events: [],
    contacts: [],
    posture: (): IAutoMovieMotionHumanPosture => props.posture,
  };
  // A stated reach and its return are paced as minimum-jerk movements over
  // their times: each peak is 15/8 of its mean speed over the farthest
  // wrist's travel, the same travel either way.
  let pace: number | undefined;
  if (reach !== undefined) {
    const wrists: ReturnType<typeof poseBones> = poseBones(
      props.body,
      reach.entry,
      undefined,
      new Set<AutoMovieHumanoidBone>(
        sides.map(
          (side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}Hand`,
        ),
      ),
    );
    pace = Math.max(
      ...sides.map(
        (side: AutoMovieHumanSide): number =>
          ((15 / 8) *
            Vector3.distance(
              goal(side).point,
              wrists.get(`${side}Hand`)!.worldPosition,
            )) /
          Math.min(reach.seconds, reach.back),
      ),
    );
  }  try {
    const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
      body: props.body,
      plan,
      side: props.side,
      rest: AutoMovieMotionHumanArm.angles(seed, props.side),
      span: { start: 0, ready, relax, end },
      ...(pace === undefined ? {} : { pace: (): number => pace! }),
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
      posture: coursed.posture(relax),
    };
  } catch (error) {
    if (error instanceof HumanRefusal) return { clear: false, refusal: error };
    throw error;
  }
}

/**
 * Companion types and constants of `fitClearArmPose`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit: the hold's span, the request, the reach and the two verdicts.
 * @evidence contracts/development/design.md#principled-representation The verdict is a union discriminated by `clear`, the refusal the planner's own; the hold's span is one frame of the planner's 120 Hz grid.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the judgement reads and returns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The grasp is the carry's own member type, not restated.
 */
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

    /** The action's reach to the hold; a hold from the first instant, seeded from the posture's own limb fit, when absent. */
    reach?: IReach;
  }

  /**
   * The reach an action comes to the hold by.
   */
  export interface IReach {
    /** The pose the arms reach from. */
    entry: IAutoMoviePose;

    /** The reach's time, seconds; positive. */
    seconds: number;

    /** The return's time from the hold to the pose reached from, seconds; positive. */
    back: number;
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
