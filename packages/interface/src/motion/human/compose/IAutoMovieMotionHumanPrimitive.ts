import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionWeaponPath } from "../law/IAutoMovieMotionWeaponPath";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
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

  /**
   * Whether its writer follows another performer live (an arm that tracks a
   * partner's region a feedback delay earlier), so the composed plan names
   * its channels (`IAutoMovieMotionHumanActionPlan.follows`). Absent, it
   * follows no one.
   */
  follows?: boolean;

  /** Seconds since the action's start from which it writes. */
  from: number;

  /** Seconds since the action's start until which it writes; not before `from`. */
  to: number;

  /** Contact windows it makes, shares of the action's duration. */
  contacts?: readonly IAutoMovieMotionHumanContactWindow[];

  /** Striking surfaces it moves on free paths. */
  weapons?: readonly IAutoMovieMotionWeaponPath[];

  /**
   * The posture with this primitive's channels written.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start, in [`from`, `to`].
   * @param before The posture so far at any second of the action: the base and earlier primitives, optionally restricted to explicitly requested channels. A movement planned once over its span reads it, so its plan is a constant of the action; absent where no action composes the primitive.
   * @param resolution Optional exact FK source borrowed only during this same-body synchronous write; never retain it in a plan, output or callback.
   * @param projection Optional genuine same-body direct ROM projector, used only for actual current solves during this write.
   * @returns The posture; fields outside the claimed channels are ignored.
   */
  write(
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    before?: IAutoMovieMotionHumanPrimitive.Reader,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture;

  /**
   * Plan what is planned once over the primitive's span, when its action is
   * planned: the composer calls it once, in the order it writes, before any
   * posture is read, so no pose read plans and a plan that cannot be made
   * refuses the action, not a frame of it. None for a primitive that plans
   * nothing.
   *
   * @param before The posture so far at any second of the action, as `write` is given it.
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both preparation and writing reuse IAutoMovieMotionHumanActionPlan.posture's existing signature, with no parallel metadata or posture record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission preserves complete reads and current query loans; explicit changed loans receive a separate query scope rather than certifying another context's result.
   */
  export type Reader = IAutoMovieMotionHumanActionPlan["posture"];
}
