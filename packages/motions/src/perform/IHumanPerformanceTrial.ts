import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionMeeting,
} from "@automovie/interface";

import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";

/**
 * An alignment trial's planning, kept for the placement that follows it.
 *
 * An action synced to an instant is planned at the start found so far until
 * that start settles (`HumanPerformanceSchedule.align`), and then placed at
 * the start the alignment returns. A plan is a pure function of its intent,
 * the start it is planned at and the placed state, so when the placement is
 * of the same intent, at the same start, with nothing placed in between, it
 * would plan the same action again; it takes this one instead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, for whom, and the three conditions under which the placement may take it; each member gives its meaning and timebase.
 * @evidence contracts/development/design.md#principled-representation The planning's own results (context, plan, entry share, recorded meetings) beside the inputs that decide equivalence: the intent's identity, the start in film seconds and two counts of the placed state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Written by `HumanPerformancePlace.place` for a trial, completed by `HumanPerformanceSchedule.align`, read once by the next placement; the performance state holds at most one.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the context, plan and meeting types; no pose, time or fitted result is held outside the plan itself.
 */
export interface IHumanPerformanceTrial {
  /** The intent planned, by identity. */
  intent: IAutoMovieIntent;

  /** The film second it was planned to become active at. */
  start: number;

  /** `HumanPerformanceState.placements` when it was planned. */
  placements: number;

  /** How many schedule entries were placed when it was planned. */
  entries: number;

  /** The context it was planned in, its start and tempo as the planning left them. */
  context: IAutoMovieMotionHumanActionContext<never>;

  /** The plan. */
  plan: IAutoMovieMotionHumanActionPlan;

  /** The share of the plan the action is entered at. */
  share: number;

  /** The meetings the planning recorded, which the alignment withdrew and the placement records again. */
  meetings: [
    string,
    { subject: string; meeting: IAutoMovieMotionMeeting },
  ][];
}
