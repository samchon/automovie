import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanGaze } from "../everyday/HumanGaze";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Gaze primitives: the eyes, and the head and neck when they may join,
 * brought onto a point of the action (the hand being offered, the partner's
 * face, the cup about to be lifted).
 *
 * The split between eyes and head and the exact solution of each eye belong
 * to {@link HumanGaze.aim}; this primitive gives it the target as a frame of
 * the action and a weight, and claims the head channel only. The trunk's
 * share of a far gaze is the trunk channel's to write, so a gaze here never
 * recruits it, and a target too far to the side stays visibly short.
 */
export namespace AutoMovieMotionHumanGaze {
  /** Which segments a gaze primitive may recruit. */
  export type Recruit = "eyes" | "head";

  /**
   * What is looked at, as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The world point, metres.
   */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => IAutoMovieVector3;

  /** A gaze over a window. */
  export interface ILook {
    /** The body. */
    body: IHumanBody;

    /** Which segments may join. */
    recruit: Recruit;

    /** Seconds since the action's start from which the head is written. */
    from: number;

    /** Seconds since the action's start until which the head is written. */
    to: number;

    /** What is looked at. */
    target: Frame;

    /**
     * How far the eyes and the head have moved from where the posture has
     * them toward the target.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /**
   * The eyes and the head brought toward a target by a weight.
   *
   * @param props The body, the target, the window and the weight.
   * @returns The primitive, on the head.
   */
  export function look(props: ILook): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["head"],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const w: number = Math.min(1, Math.max(0, props.weight(seconds)));
        return HumanGaze.aim(
          props.body,
          posture,
          props.target(posture, seconds),
          props.recruit,
          { eyes: w, head: w, trunk: 0 },
        );
      },
    };
  }

  /**
   * A glance: the gaze goes to a target and comes back, its weight rising
   * over one window and falling over another on the clock's envelope, and the
   * head is written from the first instant to the last.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param rise The instants the gaze leaves and arrives at.
   * @param fall The instants the gaze starts returning and is back at.
   * @param target What is looked at.
   * @param recruit Which segments may join.
   * @returns The primitive.
   */
  export function glance(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    target: Frame,
    recruit: Recruit = "head",
  ): IAutoMovieMotionHumanPrimitive {
    return look({
      body,
      recruit,
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      target,
      weight: (seconds: number): number => clock.envelope(rise, fall, seconds),
    });
  }
}
