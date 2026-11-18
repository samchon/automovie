import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A balancing shift an action computes only when given; absent on the
 * params, none is computed. Each field absent takes the law's
 * recommendation (`IAutoMovieMotionHumanActionLaw.balance`), and a field
 * neither gives is refused, naming it.
 *
 * Absent, nothing physical is computed: no balance shift, no centre-of-mass
 * loop, no balance solve and no integration, and the posture is the law's
 * own kinematic one; a law's studied compensation lives in its key poses.
 * Given, the shift is one closed-form evaluation of the part it moves,
 * scaled by its weight between its two instants, never iterated: animation
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
 * @evidence contracts/development/design.md#principled-representation One record: the part moved, its weight and its two event-named instants, each a named type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four terms a closed-form shift reads; nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent is none; a field is the caller's or the law's, else refused; no share of a duration names an instant.
 */
export interface IAutoMovieMotionHumanBalance {
  /** The part moved to keep the centre of mass over the support. */
  by?: IAutoMovieMotionHumanBalance.Part;

  /** The share of the full shift applied, 0 to 1. */
  weight?: number;

  /** The instant it starts. */
  from?: IAutoMovieMotionHumanBalance.IBound;

  /** The instant it ends. */
  to?: IAutoMovieMotionHumanBalance.IBound;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanBalance}.
 *
 */
export namespace IAutoMovieMotionHumanBalance {
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
