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
 * @evidence contracts/development/common.md#meaningful-documentation States primitive input/output ownership and the companion Reader's action-local seconds, optional channel demand and borrowed partial-result boundary.
 * @evidence contracts/development/design.md#principled-representation A part's movement is a function from the posture so far and the time to a posture, over a span and on declared channels; an action is such functions side by side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The claim, optional input dependencies, span, writer and optional planning, contacts and weapons serve the composer; omitted dependencies preserve complete input reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan's contact-window and weapon types; the two optional members are absent for a primitive that makes neither.
 */
export interface IAutoMovieMotionHumanPrimitive {
  /** The channels it writes. */
  channels: readonly AutoMovieMotionHumanChannel[];

  /**
   * Channels whose values determine the claimed output at the written second, including a claimed
   * channel when its previous values are added or preserved. Omission means
   * every channel. A pure time-local callback may narrow a writer whose
   * branches have different dependencies. Fields merely copied outside the claim are not reads.
   * This is a dependency declaration, so callbacks that can inspect an
   * arbitrary posture must leave it absent.
   */
  reads?:
    | readonly AutoMovieMotionHumanChannel[]
    | ((seconds: number) => readonly AutoMovieMotionHumanChannel[]);

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
   * @param before The posture so far at any second of the action: the base and earlier primitives, optionally restricted to explicitly requested channels. A movement planned once over its span reads it, so its plan is a constant of the action; absent where no action composes the primitive.
   * @param resolution Optional exact FK source borrowed only during this same-body synchronous write; never retain it in a plan, output or callback.
   * @param projection Optional genuine same-body direct ROM projector, used only for actual current solves during this write.
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
  write(
    posture: IHumanPosture,
    seconds: number,
    before?: IAutoMovieMotionHumanPrimitive.Reader,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
    projection?: Parameters<IHumanActionPlan["posture"]>[3],
  ): IHumanPosture;

  /**
   * Plan what is planned once over the primitive's span, when its action is
   * planned: the composer calls it once, in the order it writes, before any
   * posture is read, so no pose read plans and a plan that cannot be made
   * refuses the action, not a frame of it. None for a primitive that plans
   * nothing.
   *
   * @param before The posture so far at any second of the action, as `write` is given it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when it is called, by whom, why and what it is given.
   * @evidence contracts/development/implementation.md#principled-implementation A movement's plan is a constant of its action, made when the action is planned.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One member called once per primitive by `composeAutoMovieMotionHumanAction`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Called before any posture, so an implementation never plans on a read.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
   */
  prepare?(before: IAutoMovieMotionHumanPrimitive.Reader): void;
}

/**
 * Dependency-aware readers of the posture preceding a primitive.
 *
 * A Reader's action-local second and optional channel set identify the
 * prefix values its consumer may inspect. Omission requests the whole
 * posture; preparation and writing share this same borrowed-result rule.
 */
export namespace IAutoMovieMotionHumanPrimitive {
  /**
   * Read a prefix at action-local seconds. With `channels`, only those
   * channels are valid; omitted channels request them all. Optional FK/ROM
   * arguments borrow genuine same-body metadata only for this synchronous query.
   * The returned posture is borrowed and must not be mutated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States action-local seconds, optional channel demand, synchronous FK/ROM loans and borrowed partial result ownership.
   * @evidence contracts/development/design.md#principled-representation The plan-owned posture signature describes the same seconds/channel/metadata inputs of a prefix observation; only demanded values may be inspected.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both preparation and writing reuse IHumanActionPlan.posture's existing signature, with no parallel metadata or posture record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission preserves complete reads and current query loans; explicit changed loans receive a separate query scope rather than certifying another context's result.
   */
  export type Reader = IHumanActionPlan["posture"];
}
