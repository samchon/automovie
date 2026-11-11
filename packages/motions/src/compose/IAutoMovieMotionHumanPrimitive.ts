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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture and the seconds it is given, that the seconds lie in the primitive's window and that fields outside the claimed channels are ignored.
   * @evidence contracts/development/implementation.md#principled-implementation A pure function from the posture so far and the time to a posture, so an action is such functions side by side and the order of writing is the channels' order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One member called once per active primitive per evaluated second by `composeAutoMovieMotionHumanAction`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composition keeps only the claimed channels of the result and throws on two primitives that claim one channel over overlapping windows, so an implementation cannot overwrite what another part wrote.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  write(posture: IHumanPosture, seconds: number): IHumanPosture;
}
