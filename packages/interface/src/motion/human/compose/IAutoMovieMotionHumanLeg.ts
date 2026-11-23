import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Leg primitives: a foot kept on the floor, and a foot lifted and set down
 * somewhere else.
 *
 * A foot is a placement of its ankle and its rotation ({@link HumanFoot}),
 * and the leg is an effector goal solved by inverse kinematics. A planted
 * foot declares its toes' joint as the goal's contact, so where the ankle
 * cannot hold the foot flat the heel rises about the ball and the foot does
 * not slide (`HumanFoot.heelOff`). The knee bends over the foot: its hint is
 * ahead of the knee's rest place along the foot's own heading (Perry and
 * Burnfield, Gait Analysis, 2nd ed.).
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Seconds since the action's start from which the leg is written. to: Seconds since the action's start until which the leg is written.
 * @evidence contracts/development/design.md#principled-representation from: Seconds since the action's start from which the leg is written. to: Seconds since the action's start until which the leg is written.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLeg.ts (AutoMovieMotionHumanLeg.place, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanFoot.IPlacement, IAutoMovieMotionHumanBody, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLeg {
  /**
   * A foot's placement as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The placement, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each argument is, when the function is called and the result's frame.
   * @evidence contracts/development/design.md#principled-representation A foot that follows something (a swing path, a pivot about its ball) is a function of the posture so far and the time, evaluated when the row is written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed placement is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement;

  /**
   * One leg's movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation The span the leg is written over, where the foot is at each second and whether it bears then.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `place`; `plant` and `step` fill them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bearing is a function of seconds, so a foot that lands inside the span needs no second primitive.
   */
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin and what the boolean means.
     */
    planted(seconds: number): boolean;
  }
}
