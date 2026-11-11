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
 */
export namespace AutoMovieMotionHumanRoot {
  /** A displacement of the body from where its posture has it. */
  export interface IOffset {
    /** The root's move in its own floor frame; `x` left, `y` up, `z` forward, metres. */
    point: IAutoMovieVector3;

    /** The heading's turn about +Y, degrees; positive toward the performer's left. */
    yaw: number;
  }

  /** A displacement over a window. */
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
}
