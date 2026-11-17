import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Contracts used by composeAutoMovieMotionHumanAction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation base: The plan whose posture the unclaimed channels keep; as long as the clock. clock: The action's clock: its duration and its events. primitives: The part primitives, in any order.
 * @evidence contracts/development/design.md#principled-representation base: The plan whose posture the unclaimed channels keep; as long as the clock. clock: The action's clock: its duration and its events. primitives: The part primitives, in any order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionPlan, IAutoMovieMotionClock, IAutoMovieMotionHumanPrimitive identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanComposeAutoMovieMotionHumanAction {
  /**
   * An action composed of part primitives over a base. What an action is composed of.
   *
   * @evidence contracts/development/common.md#meaningful-documentation base: The plan whose posture the unclaimed channels keep; as long as the clock. clock: The action's clock: its duration and its events. primitives: The part primitives, in any order.
   * @evidence contracts/development/design.md#principled-representation base: The plan whose posture the unclaimed channels keep; as long as the clock. clock: The action's clock: its duration and its events. primitives: The part primitives, in any order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionPlan, IAutoMovieMotionClock, IAutoMovieMotionHumanPrimitive identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProps {
    /** The plan whose posture the unclaimed channels keep; as long as the clock. */
    base: IAutoMovieMotionHumanActionPlan;

    /** The action's clock: its duration and its events. */
    clock: IAutoMovieMotionClock;

    /** The part primitives, in any order. */
    primitives: readonly IAutoMovieMotionHumanPrimitive[];

    /** The clock instant that is the action's decisive instant, when it has one. */
    contact?: string;
  }
}
