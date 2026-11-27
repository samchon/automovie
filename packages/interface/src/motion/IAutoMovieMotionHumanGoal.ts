import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * Limb goals between two goals: the one owner of how an arm or a leg leaves the
 * goal an action's base gives it for the goal a primitive asks.
 *
 * The end joint and the bend hint move on straight lines and the hand's or
 * foot's rotation turns by spherical interpolation, all by one weight. A limb
 * between two goals bears on nothing, so it is not planted; it keeps the asked
 * goal's contact, the point the resolver holds when the rotation is out of
 * range, and its reference solution. Both goals are in one frame: the world, or
 * the same bone.
 */
export namespace IAutoMovieMotionHumanGoal {
  /**
   * A limb goal as a frame of the action: a function of the posture so far and
   * the seconds since the action's start.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieHumanLimbGoal;

  /** One limb driven toward a goal. */
  export interface IToward {
    /** The limb. */
    limb: AutoMovieHumanLimb;

    /** Seconds since the action's start from which the limb is written. */
    from: number;

    /** Seconds since the action's start until which the limb is written. */
    to: number;

    /** The goal at weight 1. */
    goal: IAutoMovieMotionHumanGoal.Frame;

    /** The goal at weight 0; the goal the posture so far holds when absent. */
    origin?: IAutoMovieMotionHumanGoal.Frame;

    /**
     * How far the limb is from its origin to its goal.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }
}
