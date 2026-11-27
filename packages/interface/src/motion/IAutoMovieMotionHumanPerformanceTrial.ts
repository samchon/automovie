import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieMotionMeeting } from "./IAutoMovieMotionMeeting";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";

/**
 * An alignment trial's planning, kept for the placement that follows it.
 *
 * An action synced to an instant is planned at the start found so far until
 * that start settles (`HumanPerformanceSchedule.align`), and then placed at the
 * start the alignment returns. A plan is a pure function of its intent, the
 * start it is planned at and the placed state, so when the placement is of the
 * same intent, at the same start, with nothing placed in between, it would plan
 * the same action again; it takes this one instead.
 */
export interface IAutoMovieMotionHumanPerformanceTrial {
  /** The intent planned, by identity. */
  intent: IAutoMovieIntent;

  /** The film second it was planned to become active at. */
  start: number;

  /** `IAutoMovieMotionHumanPerformanceState.placements` when it was planned. */
  placements: number;

  /** How many schedule entries were placed when it was planned. */
  entries: number;

  /**
   * The context it was planned in, its start and tempo as the planning left
   * them.
   */
  context: IAutoMovieMotionHumanActionContext<never>;

  /** The plan. */
  plan: IAutoMovieMotionHumanActionPlan;

  /** The share of the plan the action is entered at. */
  share: number;

  /**
   * The meetings the planning recorded, which the alignment withdrew and the
   * placement records again.
   */
  meetings: [
    string,
    {
      /** Scene subject id of the performer that recorded the meeting. */
      subject: string;
      /** The recorded meeting. */
      meeting: IAutoMovieMotionMeeting;
    },
  ][];
}
