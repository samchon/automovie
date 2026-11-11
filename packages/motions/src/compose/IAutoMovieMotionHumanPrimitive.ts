import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";

/**
 * One part's movement over one window of an action: a pure function of time
 * that writes the channels it claims and nothing else.
 *
 * A primitive is built against the action's clock and takes its target as a
 * frame evaluated on the posture it is given (a region of the performer's own
 * body, another performer, a prop, the world), never as a constant of one
 * body. The composition gives it the posture the base and the channels
 * written before it produced, and keeps only the claimed channels of what it
 * returns ({@link AutoMovieMotionHumanChannel.merge}).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a primitive is, what it is built against, what posture it is given and what of its result is kept.
 * @evidence contracts/development/design.md#principled-representation A part's movement is a function from the posture so far and the time to a posture, over a span and on declared channels; an action is such functions side by side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Six members: the claim, the span, the function, and the two things only a primitive knows that a plan must carry (its contacts and its weapons).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan's contact-window and weapon types; the two optional members are absent for a primitive that makes neither.
 */
export interface IAutoMovieMotionHumanPrimitive {
  /** The channels it writes. */
  channels: readonly AutoMovieMotionHumanChannel[];

  /** Seconds since the action's start from which it writes. */
  from: number;

  /** Seconds since the action's start until which it writes; not before `from`. */
  to: number;

  /** Contact windows it makes, shares of the action's duration. */
  contacts?: readonly IHumanContactWindow[];

  /** Striking surfaces it moves on free paths. */
  weapons?: readonly IHumanActionPlan.IWeapon[];

  /**
   * The posture with this primitive's channels written.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start, in [`from`, `to`].
   * @returns The posture; fields outside the claimed channels are ignored.
   */
  write(posture: IHumanPosture, seconds: number): IHumanPosture;
}
