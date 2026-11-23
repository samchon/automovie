import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Root primitives: the whole body moved and turned on the floor, in the
 * performer's own frame (a weight shift to one side, a sink into the knees, a
 * step's advance, a turn toward a partner).
 *
 * The root is the first channel written, so the trunk, the head and the limbs
 * of the same second are placed on the moved body. Planted legs keep their
 * world goals and are solved again on the moved pelvis, which is what bends
 * the knees when the root sinks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: The root's move in its own floor frame; `x` left, `y` up, `z` forward, metres. yaw: The heading's turn about +Y, degrees; positive toward the performer's left. from: Seconds since the action's start from which the root is written.
 * @evidence contracts/development/design.md#principled-representation point: The root's move in its own floor frame; `x` left, `y` up, `z` forward, metres. yaw: The heading's turn about +Y, degrees; positive toward the performer's left. from: Seconds since the action's start from which the root is written.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.place, offset); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.scale, offset); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.scale, return); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.excursion, to); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.excursion, return); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.shift, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRoot {
  /**
   * A displacement of the body from where its posture has it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, axes, unit and sign.
   * @evidence contracts/development/design.md#principled-representation A rigid move on the floor: a translation in the body's own frame and a turn about the vertical.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; pitch and roll belong to the trunk channel and are not here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the vector type; the turn is a signed number of degrees like the posture's yaw.
   */
  export interface IOffset {
    /** The root's move in its own floor frame; `x` left, `y` up, `z` forward, metres. */
    point: IAutoMovieVector3;

    /** The heading's turn about +Y, degrees; positive toward the performer's left. */
    yaw: number;
  }

  /**
   * A displacement over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The span the root is written over and the displacement at each second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `travel`; `excursion` fills them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The offset is a function of seconds and not a pair of ends with a named easing.
   */
  export interface ITravel {
    /** Seconds since the action's start from which the root is written. */
    from: number;

    /** Seconds since the action's start until which the root is written. */
    to: number;

    /**
     * Where the body is from where the posture so far has it.
     *
     * @param seconds Seconds since the action's start.
     * @returns The displacement.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin and that the result is a displacement in the posture's own floor frame.
     */
    offset(seconds: number): IAutoMovieMotionHumanRoot.IOffset;
  }
}
