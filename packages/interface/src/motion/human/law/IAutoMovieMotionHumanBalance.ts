import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A balancing shift an action computes only when given; absent on the
 * params, none is computed. Each field absent takes the law's
 * recommendation (`IAutoMovieMotionHumanActionLaw.balance`). Without a
 * recommendation, the weight is 1 and the ramp durations are zero.
 * A missing part or bound is refused by field name.
 *
 * Absent, nothing physical is computed: no balance shift, no centre-of-mass
 * loop, no balance solve and no integration, and the posture is the law's
 * own kinematic one; a law's studied compensation lives in its key poses.
 * Given, the law computes a correction for the chosen part on its eligible
 * support phase. A constrained contact can require a numerical fit. The
 * prepared weight scales the correction between the two instants. Animation
 * tools keep such terms off a posed character until asked, Houdini's
 * full-body IK taking its centre-of-mass target only as an optional record
 * with its weight inside it (`hou.ik.solvePhysFBIK`), and a simulation pays
 * every step, substep and solver iteration of its interval where a posed
 * instant pays one read. Its bounds are events, not shares of the action
 * (laws/declaration.md: other work addresses an action through its named
 * events, because a fraction breaks when the duration changes with the
 * body), resolved as the scheduled instants are.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when it is computed, how each field defaults, what absent computes, how a shift applies and why its bounds are events.
 * @evidence contracts/development/design.md#principled-representation One record names the part moved, its weight, its two event-named instants and easing durations in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPhysics resolves the author's part, bounds, weight and ramp. The receiving law supplies the supported correction for that part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Balance is opt-in. The caller or law must supply the part and both event bounds, and the weight and ramp have explicit defaults.
 */
export interface IAutoMovieMotionHumanBalance {
  /** The part moved to keep the centre of mass over the support. */
  by?: IAutoMovieMotionHumanBalance.Part;

  /** The share of the needed shift applied, from 0 to 1. Defaults to 1 after the law's recommendation. */
  weight?: number;

  /** The instant it starts. */
  from?: IAutoMovieMotionHumanBalance.IBound;

  /** The instant it ends. */
  to?: IAutoMovieMotionHumanBalance.IBound;

  /** The blend durations inside the bounds. By default the weight takes effect at the bounds. */
  ramp?: IAutoMovieMotionHumanBalance.IRamp;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanBalance}.
 *
 */
export namespace IAutoMovieMotionHumanBalance {
  /**
   * A placed action's prepared balance, shared by its posture and audit.
   * The numeric bounds use seconds since that action's own time zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the timebase and the two readers.
   * @evidence contracts/development/design.md#principled-representation One part, admitted weight and ramp, and numeric bounds on one action clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The posture and audit borrow the same prepared window from HumanPhysics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record fixes timing without retaining poses or evaluated phase samples.
   */
  export interface IWindow extends IInterval {
    /** The body part that performs the shift. */
    by: Part;

    /** The eligible support phase when only part of the authored interval can move the selected part. */
    phase?: IInterval;

    /** The full share of the needed shift before easing, from 0 to 1. */
    weight: number;

    /** Durations of the opening and closing blends in seconds. */
    ramp: IRamp;
  }

  /**
   * A closed interval in seconds on the prepared action clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both endpoints use seconds since the action began and belong to the interval.
   * @evidence contracts/development/design.md#principled-representation Numeric endpoints distinguish a time from a duration. HumanPhysics checks ordering when resolving authored bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared window and its eligible support phase share endpoints so pose and audit use the same clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interval carries resolved times without assuming a frame rate or retaining schedule events.
   */
  export interface IInterval {
    /** First action second. */
    from: number;
    /** Last action second. */
    to: number;
  }

  /**
   * A placed balance window or null where the action applies none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a plan has no active window.
   * @evidence contracts/development/design.md#principled-representation A numeric action-local window or no correction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by IAutoMovieMotionHumanActionPlan and the balance audit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An off request carries no dummy window.
   */
  export type Window = IWindow | null;

  /**
   * Minimum-jerk blends at the two ends of a balance window, measured in seconds.
   * When their sum exceeds the window, both are shortened by the same factor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, where each duration is applied and how overlapping blends fit into the window.
   * @evidence contracts/development/design.md#principled-representation Two nonnegative finite durations; HumanPhysics validates finiteness and range at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPhysics uses each duration at its own endpoint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Blends use actual bounds and seconds, with the requested relative blend duration preserved when they meet.
   */
  export interface IRamp {
    /** Seconds from the opening bound to full weight, nonnegative. */
    in: number;

    /** Seconds from full weight down to zero at the closing bound, nonnegative. */
    out: number;
  }

  /**
   * A posture's whole-body centre of mass and the support points of its
   * feet (the bearing outline of each, `HumanFoot.base`), world metres: what
   * `HumanBalance.support` reads to judge a body's balance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two readings, their frame and unit, and their reader.
   * @evidence contracts/development/design.md#principled-representation The centre and the support points, each world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What HumanBalance.support returns; nothing else.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3; the readings stay with their producer.
   */
  export interface ISupport {
    /** Whole-body centre of mass of the supplied posture in world metres; not the support polygon's centre. */
    centre: IAutoMovieVector3;

    /** World-space support points in metres, used to judge the body's balance. */
    points: IAutoMovieVector3[];
  }

  /**
   * The part a balancing shift moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two parts.
   * @evidence contracts/development/design.md#principled-representation A closed set of named parts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The parts today's balancing laws move.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No part is inferred from anything but this field.
   */
  export type Part = "hips" | "trunk";

  /**
   * An instant named by an event, as the scheduled instants name theirs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each field, its default and the two reserved event names.
   * @evidence contracts/development/design.md#principled-representation An event of this action, another action or a cue, with its occurrence and an offset in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The terms the instant resolver reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No share of a duration: an event, resolved as the scheduled instants are.
   */
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
