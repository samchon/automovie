import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";

/**
 * Root primitives: the whole body moved and turned on the floor, in the
 * performer's own frame (a weight shift to one side, a sink into the knees, a
 * step's advance, a turn toward a partner).
 *
 * The root is the first channel written, so the trunk, the head and the limbs
 * of the same second are placed on the moved body. Planted legs keep their
 * world goals and are solved again on the moved pelvis, which is what bends the
 * knees when the root sinks.
 */
export namespace AutoMovieMotionHumanRoot {
  /**
   * A posture displaced in its own floor frame: the root moved along the
   * heading it had, then the heading turned.
   *
   * @param posture The posture.
   * @param offset The displacement.
   * @returns The displaced posture.
   */
  export function place(
    posture: IAutoMovieMotionHumanPosture,
    offset: IAutoMovieMotionHumanRoot.IOffset,
  ): IAutoMovieMotionHumanPosture {
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
   */
  export function scale(
    offset: IAutoMovieMotionHumanRoot.IOffset,
    share: number,
  ): IAutoMovieMotionHumanRoot.IOffset {
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
   */
  export function travel(
    props: IAutoMovieMotionHumanRoot.ITravel,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["root"],
      reads: ["root"],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => place(posture, props.offset(seconds)),
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
   */
  export function excursion(
    clock: IAutoMovieMotionClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    to: IAutoMovieMotionHumanRoot.IOffset,
  ): IAutoMovieMotionHumanPrimitive {
    return travel({
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset =>
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
   * @returns The primitive, on the root from the first instant to the clock's
   *   end.
   */
  export function shift(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    by: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPrimitive {
    return travel({
      from: clock.at(window[0]),
      to: clock.duration,
      offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset =>
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
   * @param yaw The turn about +Y, degrees; positive toward the performer's
   *   left.
   * @returns The primitive, on the root from the first instant to the clock's
   *   end.
   */
  export function face(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    yaw: number,
  ): IAutoMovieMotionHumanPrimitive {
    return travel({
      from: clock.at(window[0]),
      to: clock.duration,
      offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset =>
        scale(
          { point: { x: 0, y: 0, z: 0 }, yaw },
          clock.progress(window[0], window[1], seconds),
        ),
    });
  }
}
