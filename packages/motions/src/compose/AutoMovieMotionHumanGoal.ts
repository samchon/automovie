import { Quaternion, Vector3 } from "@automovie/engine";

import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Limb goals between two goals: the one owner of how an arm or a leg leaves
 * the goal an action's base gives it for the goal a primitive asks.
 *
 * The end joint and the bend hint move on straight lines and the hand's or
 * foot's rotation turns by spherical interpolation, all by one weight. A limb
 * between two goals bears on nothing, so it is not planted; it keeps the
 * asked goal's contact, the point the resolver holds when the rotation is out
 * of range. Both goals are in one frame: the world, or the same bone.
 */
export namespace AutoMovieMotionHumanGoal {
  /**
   * A goal a share of the way from one goal to another.
   *
   * @param from The goal at weight 0.
   * @param to The goal at weight 1.
   * @param weight How far, clamped to [0, 1].
   * @returns `from` at 0, `to` at 1, and the mixed goal between.
   * @throws {Error} When the goals are attached to different frames.
   */
  export function mix(
    from: IHumanPosture.IGoal,
    to: IHumanPosture.IGoal,
    weight: number,
  ): IHumanPosture.IGoal {
    const s: number = Math.min(1, Math.max(0, weight));
    if (s <= 0) return from;
    if (s >= 1) return to;
    if (from.on !== to.on)
      throw new Error(
        `A limb goal on ${from.on ?? "the world"} cannot be mixed with one on ${to.on ?? "the world"}`,
      );
    return {
      point: Vector3.lerp(from.point, to.point, s),
      bend: Vector3.lerp(from.bend, to.bend, s),
      ...(to.rotation === undefined
        ? from.rotation === undefined
          ? {}
          : { rotation: from.rotation }
        : {
            rotation: Quaternion.slerp(
              from.rotation ?? to.rotation,
              to.rotation,
              s,
            ),
          }),
      ...(to.contact === undefined ? {} : { contact: to.contact }),
      ...(to.on === undefined ? {} : { on: to.on }),
    };
  }

  /** A limb goal as a frame of the action. */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => IHumanPosture.IGoal;

  /** One limb driven toward a goal. */
  export interface IToward {
    /** The limb. */
    limb: IHumanPosture.Limb;

    /** Seconds since the action's start from which the limb is written. */
    from: number;

    /** Seconds since the action's start until which the limb is written. */
    to: number;

    /** The goal at weight 1. */
    goal: Frame;

    /** The goal at weight 0; the goal the posture so far holds when absent. */
    origin?: Frame;

    /**
     * How far the limb is from its origin to its goal.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /**
   * The goal of a limb driven toward a goal at a second.
   *
   * @param props The limb, its goal, its origin and its weight.
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The goal.
   * @throws {Error} When no origin is given and the posture holds no goal for the limb.
   */
  export function toward(
    props: IToward,
    posture: IHumanPosture,
    seconds: number,
  ): IHumanPosture.IGoal {
    const origin: IHumanPosture.IGoal | undefined =
      props.origin === undefined
        ? posture.limbs[props.limb]
        : props.origin(posture, seconds);
    if (origin === undefined)
      throw new Error(
        `The ${props.limb} has no goal to leave; give the primitive an origin`,
      );
    return mix(origin, props.goal(posture, seconds), props.weight(seconds));
  }

  /**
   * A limb driven toward a goal by a weight: the primitive for the limbs an
   * action places by a goal of its own making (a fist on a striking path, a
   * glove before the face, a foot on a kick's arc).
   *
   * @param props The limb, its window, its goal, its origin and its weight.
   * @returns The primitive, on the limb's channel.
   */
  export function drive(props: IToward): IAutoMovieMotionHumanPrimitive {
    return {
      channels: [props.limb],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          [props.limb]: toward(props, posture, seconds),
        },
      }),
    };
  }

  /**
   * A limb taken to a goal and brought back: the goal's share rises over one
   * window and falls over another on the clock's envelope, and the limb is
   * written from the first instant to the last.
   *
   * @param clock The action's clock.
   * @param limb The limb.
   * @param rise The instants the limb leaves its origin and arrives at.
   * @param fall The instants the limb starts back and is back at.
   * @param goal The goal at the envelope's full share.
   * @param origin The goal left and returned to; the posture's own when absent.
   * @param size The envelope's scale, in (0, 1]; 1 when absent.
   * @returns The primitive.
   */
  export function pulse(
    clock: AutoMovieMotionClock.IClock,
    limb: IHumanPosture.Limb,
    rise: readonly [string, string],
    fall: readonly [string, string],
    goal: Frame,
    origin?: Frame,
    size: number = 1,
  ): IAutoMovieMotionHumanPrimitive {
    return drive({
      limb,
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      goal,
      ...(origin === undefined ? {} : { origin }),
      weight: (seconds: number): number =>
        size * clock.envelope(rise, fall, seconds),
    });
  }
}
