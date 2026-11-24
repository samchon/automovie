import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingBlade,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { precisionStrokePeak } from "../lexicon/precisionStrokePeak";

/**
 * Plan a one-handed stroke whose path stays in one basin of the arm (a thrust
 * drawn back from its landing, recovered to its guard) with the arm laid as one
 * admitted course (`courseArmGoal`) instead of a fit per sample: the reach from
 * the entry hold to the guard, the path's start, free, as the planner lays it;
 * from there the attack, its follow-through and the recovery to the guard held
 * to the end, instant by instant on the branch and swivel the instant before
 * chose. The course is admitted against the stroke's own speed
 * (`precisionStrokePeak`) and the reach's minimum-jerk peak, 15/8 of its mean
 * speed over the arm's own travel to the guard. A supported stroke is the
 * fitted plan unchanged.
 *
 * @param plan The fitted stroke's planner (`StrikingBlade.plan`).
 * @param context The action's context.
 * @param stroke The stroke.
 * @param travel The arm's own travel from the entry hold to the guard, metres:
 *   the greater of the hand's and the elbow's, which the caller measured on the
 *   two fitted arms.
 * @returns The plan, whose decisive instant is `stroke`, its arm coursed.
 * @throws {HumanRefusal} When no arm course meets the trajectory's constraints,
 *   as the plan is composed.
 */
export function StrikingBladeCoursed(
  plan: StrikingBladeCoursed.Plan,
  context: IAutoMovieMotionHumanActionContext,
  stroke: IAutoMovieMotionHumanStrikingBlade.IStroke,
  travel: number,
): IAutoMovieMotionHumanActionPlan {
  if (stroke.support !== null) return plan(context, stroke);
  const goals: IAutoMovieMotionHumanActionPlan = plan(
    context,
    stroke,
    !stroke.stay,
  );
  const { tool, clock }: IAutoMovieMotionHumanStrikingBlade.IStroke = stroke;
  const duration: number = clock.duration;
  const ready: number = clock.at("strokeStart");
  const reach: number = ready > 0 ? ((15 / 8) * travel) / ready : 0;
  const fastest: number = Math.max(
    precisionStrokePeak(goals.posture, `${tool.side}Arm`, duration),
    reach,
  );
  return courseArmGoal({
    context,
    side: tool.side,
    plan: goals,
    span: { start: 0, ready, relax: duration, end: duration },
    pace: (): number => fastest,
  });
}

/** The planner a coursed stroke lays its arm over. */
export namespace StrikingBladeCoursed {
  /**
   * A fitted stroke's planner.
   *
   * @param context The action's context.
   * @param stroke The stroke.
   * @param along Whether the recovery draws the tool back along its path.
   * @returns The plan.
   */
  export type Plan = (
    context: IAutoMovieMotionHumanActionContext,
    stroke: IAutoMovieMotionHumanStrikingBlade.IStroke,
    along?: boolean,
  ) => IAutoMovieMotionHumanActionPlan;
}
