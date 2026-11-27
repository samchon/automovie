import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanFoot } from "./IAutoMovieMotionHumanFoot";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * Leg primitives: a foot kept on the floor, and a foot lifted and set down
 * somewhere else.
 *
 * A foot is a placement of its ankle and its rotation ({@link HumanFoot}), and
 * the leg is an effector goal solved by inverse kinematics. A planted foot
 * declares its toes' joint as the goal's contact, so where the ankle cannot
 * hold the foot flat the heel rises about the ball and the foot does not slide
 * (`HumanFoot.heelOff`). The knee bends over the foot: its hint is ahead of the
 * knee's rest place along the foot's own heading (Perry and Burnfield, Gait
 * Analysis, 2nd ed.).
 */
export namespace IAutoMovieMotionHumanLeg {
  /**
   * A foot's placement as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The placement, world frame.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement;

  /** One leg's movement. */
  export interface IPlace {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The leg. */
    side: AutoMovieHumanSide;

    /** Seconds since the action's start from which the leg is written. */
    from: number;

    /** Seconds since the action's start until which the leg is written. */
    to: number;

    /** Where the foot is. */
    placement: IAutoMovieMotionHumanLeg.Frame;

    /**
     * Whether the foot bears on the floor.
     *
     * @param seconds Seconds since the action's start.
     * @returns `true` while it is planted.
     */
    planted(seconds: number): boolean;
  }
}
