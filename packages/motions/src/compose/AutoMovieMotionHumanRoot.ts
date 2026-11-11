import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what the root moves, the frame it moves in, why it is written first and what happens to planted legs.
 * @evidence contracts/development/design.md#principled-representation A displacement in the performer's own floor frame, so "left" and "forward" mean the same at every heading; the legs follow from their unchanged world goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The displacement and its scaling, one primitive (`travel`) and one named time course (`excursion`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The offset is added to the posture so far, never set, so a root row composes with a moving base.
 */
export namespace AutoMovieMotionHumanRoot {
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
     * @evidence contracts/development/implementation.md#principled-implementation The displacement is a pure function of the seconds in the frame of the heading the posture had, so a root travels without a world coordinate.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `travel`; `excursion` fills it from a clock.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts place applies the displacement as returned, with no clamp of its own, so its range is the movement's own.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    offset(seconds: number): IOffset;
  }

  /**
   * A posture displaced in its own floor frame: the root moved along the
   * heading it had, then the heading turned.
   *
   * @param posture The posture.
   * @param offset The displacement.
   * @returns The displaced posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the move and the turn.
   * @evidence contracts/development/implementation.md#principled-implementation The floor-frame transform of the offset by the heading the posture had, then the turn added, so the move does not depend on the turn of the same offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every other member of the posture is kept as it is.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function place(
    posture: IHumanPosture,
    offset: IOffset,
  ): IHumanPosture {
    return {
      ...posture,
      root: HumanFrame.point(
        { origin: posture.root, yaw: posture.yaw },
        offset.point,
      ),
      yaw: posture.yaw + offset.yaw,
    };
  }

  /**
   * A share of a displacement: its move and its turn both scaled.
   *
   * @param offset The displacement.
   * @param share The share, 0 for none and 1 for all of it.
   * @returns The scaled displacement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is scaled and the share's two ends.
   * @evidence contracts/development/implementation.md#principled-implementation A displacement is linear in its translation and its turn, so a share of it scales both.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is not clamped: a caller that passes a clock's envelope already has a value in [0, 1], and an overshoot is the caller's to ask for.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function scale(offset: IOffset, share: number): IOffset {
    return {
      point: {
        x: offset.point.x * share,
        y: offset.point.y * share,
        z: offset.point.z * share,
      },
      yaw: offset.yaw * share,
    };
  }

  /**
   * The body displaced by an offset that varies with time.
   *
   * @param props The window and the offset.
   * @returns The primitive, on the root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is displaced and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation Each second the offset is evaluated and applied to the posture so far.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `place`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Claims the root only; pitch and roll are the trunk's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `place`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function travel(props: ITravel): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["root"],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture =>
        place(posture, props.offset(seconds)),
    };
  }

  /**
   * The body displaced and brought back: the offset's share rises over one
   * window and falls over another on the clock's envelope, and the root is
   * written from the first instant to the last, so it leaves and rejoins the
   * base without a jump.
   *
   * @param clock The action's clock.
   * @param rise The instants the body starts moving and arrives at.
   * @param fall The instants the body starts returning and is back at.
   * @param to The displacement at its fullest.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the span written and that the root rejoins the base.
   * @evidence contracts/development/implementation.md#principled-implementation A body that leaves and returns is the displacement scaled by the clock's envelope, which is 0 at both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `travel` with the scaled offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The windows are named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `travel`, `scale` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function excursion(
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    to: IOffset,
  ): IAutoMovieMotionHumanPrimitive {
    return travel({
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      offset: (seconds: number): IOffset =>
        scale(to, clock.envelope(rise, fall, seconds)),
    });
  }

  /**
   * A shift: the body moves by a displacement between two instants on the
   * clock's minimum-jerk progress and stays there until the action's end (the
   * weight carried onto one foot, a step's advance, a sink into a seat).
   *
   * @param clock The action's clock.
   * @param window The instants the body starts moving and arrives at.
   * @param by The move in the body's own floor frame, metres.
   * @returns The primitive, on the root from the first instant to the clock's end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the window, the frame and unit, and how long the primitive holds.
   * @evidence contracts/development/implementation.md#principled-implementation A body carried from one place to another starts and ends at rest, so the displacement is scaled by the clock's minimum-jerk progress; the primitive runs to the clock's end because a moved body stays where it arrived.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `travel` with the scaled offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the displacement is the caller's. No law reads it yet; the steps and the seats rebuilt for #3286 are the consumers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `travel`, `scale` and the clock; `excursion` is the same offset on an envelope for a move that returns.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function shift(
    clock: AutoMovieMotionClock.IClock,
    window: readonly [string, string],
    by: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPrimitive {
    return travel({
      from: clock.at(window[0]),
      to: clock.duration,
      offset: (seconds: number): IOffset =>
        scale(
          { point: by, yaw: 0 },
          clock.progress(window[0], window[1], seconds),
        ),
    });
  }

  /**
   * A facing turn: the heading turns by an angle between two instants on the
   * clock's minimum-jerk progress and stays there until the action's end.
   *
   * @param clock The action's clock.
   * @param window The instants the turn starts and arrives at.
   * @param yaw The turn about +Y, degrees; positive toward the performer's left.
   * @returns The primitive, on the root from the first instant to the clock's end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the window, the unit and sign, and how long the primitive holds.
   * @evidence contracts/development/implementation.md#principled-implementation A turn of the heading starts and ends at rest, so the angle is scaled by the clock's minimum-jerk progress and held to the clock's end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `travel` with the scaled offset, the same shape as `shift` with the angle in place of the displacement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the angle is the caller's, and the feet are not moved here, so a law that turns the body turns its feet with the leg phrases. No law reads it yet.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `travel`, `scale` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function face(
    clock: AutoMovieMotionClock.IClock,
    window: readonly [string, string],
    yaw: number,
  ): IAutoMovieMotionHumanPrimitive {
    return travel({
      from: clock.at(window[0]),
      to: clock.duration,
      offset: (seconds: number): IOffset =>
        scale(
          { point: { x: 0, y: 0, z: 0 }, yaw },
          clock.progress(window[0], window[1], seconds),
        ),
    });
  }
}
