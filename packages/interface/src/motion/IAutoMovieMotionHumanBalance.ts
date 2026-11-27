import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A balancing shift an action computes only when given; absent on the params,
 * none is computed. Each field absent takes the law's recommendation
 * (`IAutoMovieMotionHumanActionLaw.balance`). Without a recommendation, the
 * weight is 1 and the ramp durations are zero. A missing part or bound is
 * refused by field name.
 *
 * Absent, nothing physical is computed: no balance shift, no centre-of-mass
 * loop, no balance solve and no integration, and the posture is the law's own
 * kinematic one; a law's studied compensation lives in its key poses. Given,
 * the law computes a correction for the chosen part on its eligible support
 * phase. A constrained contact can require a numerical fit. The prepared weight
 * scales the correction between the two instants. Such terms stay off a posed
 * character until asked, and a simulation pays every step, substep and
 * solver iteration of its interval where a posed instant pays one read. Its
 * bounds are events, not shares of the action (laws/declaration.md: other work
 * addresses an action through its named events, because a fraction breaks when
 * the duration changes with the body), resolved as the scheduled instants are.
 */
export interface IAutoMovieMotionHumanBalance {
  /** The part moved to keep the centre of mass over the support. */
  by?: IAutoMovieMotionHumanBalance.Part;

  /**
   * The share of the needed shift applied, from 0 to 1. Defaults to 1 after the
   * law's recommendation.
   */
  weight?: number;

  /** The instant it starts. */
  from?: IAutoMovieMotionHumanBalance.IBound;

  /** The instant it ends. */
  to?: IAutoMovieMotionHumanBalance.IBound;

  /**
   * The blend durations inside the bounds. By default the weight takes effect
   * at the bounds.
   */
  ramp?: IAutoMovieMotionHumanBalance.IRamp;
}

/** Companion types of {@link IAutoMovieMotionHumanBalance}. */
export namespace IAutoMovieMotionHumanBalance {
  /**
   * A placed action's prepared balance, shared by its posture and audit. The
   * numeric bounds use seconds since that action's own time zero.
   */
  export interface IWindow extends IInterval {
    /** The body part that performs the shift. */
    by: Part;

    /**
     * The eligible support phase when only part of the authored interval can
     * move the selected part.
     */
    phase?: IInterval;

    /** The full share of the needed shift before easing, from 0 to 1. */
    weight: number;

    /** Durations of the opening and closing blends in seconds. */
    ramp: IRamp;
  }

  /** A closed interval in seconds on the prepared action clock. */
  export interface IInterval {
    /** First action second. */
    from: number;
    /** Last action second. */
    to: number;
  }

  /** A placed balance window or null where the action applies none. */
  export type Window = IWindow | null;

  /**
   * Minimum-jerk blends at the two ends of a balance window, measured in
   * seconds. When their sum exceeds the window, both are shortened by the same
   * factor.
   */
  export interface IRamp {
    /** Seconds from the opening bound to full weight, nonnegative. */
    in: number;

    /** Seconds from full weight down to zero at the closing bound, nonnegative. */
    out: number;
  }

  /**
   * A posture's whole-body centre of mass and the support points of its feet
   * (the bearing outline of each, `HumanFoot.base`), world metres: what
   * `HumanBalance.support` reads to judge a body's balance.
   */
  export interface ISupport {
    /**
     * Whole-body centre of mass of the supplied posture in world metres; not
     * the support polygon's centre.
     */
    centre: IAutoMovieVector3;

    /** World-space support points in metres, used to judge the body's balance. */
    points: IAutoMovieVector3[];
  }

  /** The part a balancing shift moves. */
  export type Part = "hips" | "trunk";

  /** An instant named by an event, as the scheduled instants name theirs. */
  export interface IBound {
    /** The action or cue whose event it is; this action when absent. */
    of?: string;

    /** The event's name; `start` and `end` name the action's own ends. */
    event: string;

    /** Zero-based occurrence of a repeated event; 0 when absent. */
    index?: number;

    /** Signed seconds added to the event's instant; 0 when absent. */
    offset?: number;
  }
}
