import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanFrame } from "../posture/IAutoMovieMotionHumanFrame";
import type { IAutoMovieMotionCoupling } from "./IAutoMovieMotionCoupling";
import type { IAutoMovieMotionMeetingRole } from "./IAutoMovieMotionMeetingRole";
import type { IAutoMovieMotionMeetingTiming } from "./IAutoMovieMotionMeetingTiming";

/**
 * A resolved meeting between named performer roles, with its shared frame,
 * contacts, synchronized instants and optional coupling. Actions and
 * performance evaluation consume the same meeting.
 */
export interface IAutoMovieMotionMeeting {
  /** The kind's name. */
  kind: string;

  /**
   * The shared frame: its origin on the floor at the mean of the roles' floor
   * points, heading from the first role to the second, or to the mean floor
   * point of the others when more than two meet; one role's own floor point and
   * heading when it is alone.
   */
  frame: IAutoMovieMotionHumanFrame;

  /** Each contact's point in the frame; `x` left, `y` up, `z` forward, metres. */
  contacts: Readonly<Record<string, IAutoMovieVector3>>;

  /**
   * Outward contact normals in the shared frame when anatomical surfaces define
   * the meeting.
   */
  normals?: Readonly<Record<string, IAutoMovieVector3>>;

  /** The shared instants, film seconds. */
  instants: IAutoMovieMotionMeetingTiming;

  /** The roles present, in the meeting's order. */
  roles: readonly Pick<IAutoMovieMotionMeetingRole, "name" | "subject">[];

  /** Whether every role is present, so the contacts can be touched. */
  solid: boolean;

  /**
   * How one role bears another, for a kind that couples them and when the
   * meeting is solid.
   */
  coupling?: IAutoMovieMotionCoupling;
}

/** Operation-local contracts supporting IAutoMovieMotionMeeting. */
export namespace IAutoMovieMotionMeeting {
  /**
   * The film seconds a meeting holds over, as the composition states them: the
   * contact is made no earlier than `from` and left at `to`, and the partners
   * are free before and after. A meeting whose natural contact comes before
   * `from` is moved later as a whole; one that would leave before `to` is held
   * until then.
   */
  export interface IWindow {
    /** The earliest film second of the contact; the natural one when absent. */
    from?: number;

    /** The film second the contact is left; the natural one when absent. */
    to?: number;
  }

  /**
   * The meeting of a mutual action. Input context of AutoMovieMotionMeeting.of.
   * The film second the meeting starts at.
   */
  export type IOfContext = {
    /**
     * Action start in performance seconds, used to place the meeting on the
     * shared timeline.
     */
    start: number;
  };
}
