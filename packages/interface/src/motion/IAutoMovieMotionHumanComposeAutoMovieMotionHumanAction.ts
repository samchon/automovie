import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/** Contracts used by composeAutoMovieMotionHumanAction. */
export namespace IAutoMovieMotionHumanComposeAutoMovieMotionHumanAction {
  /**
   * An action composed of part primitives over a base. What an action is
   * composed of.
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
