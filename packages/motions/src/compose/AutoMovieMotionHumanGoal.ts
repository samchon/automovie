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
 * of range, and its reference solution. Both goals are in one frame: the
 * world, or the same bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves how between two goals, why a limb between them is not planted, what it keeps of the asked goal and the frame rule.
 * @evidence contracts/development/design.md#principled-representation A limb goal is a point, a bend hint and a rotation, so a goal between two is their interpolation by one weight.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mix, the goal of a driven limb, one primitive (`drive`) and one named time course (`pulse`); the only owner of goal interpolation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Works on the posture's own goal type for any of the four limbs; mismatched frames throw.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both ends, the clamp, the middle and when it throws.
   * @evidence contracts/development/implementation.md#principled-implementation Points interpolate on lines and the rotation on the sphere; the plant is dropped because a moving limb bears on nothing, and the contact, the frame and the reference are the asked goal's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two early returns for the ends, one frame check and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ends return the given goals themselves, so a plant held at an end is kept; a rotation only one goal states is held, not interpolated from an invented one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse beyond the engine's interpolation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
      ...(to.reference === undefined ? {} : { reference: to.reference }),
    };
  }

  /**
   * A limb goal as a frame of the action: a function of the posture so far
   * and the seconds since the action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the function takes and returns.
   * @evidence contracts/development/design.md#principled-representation A goal that rides on the body or follows a path is a function of the posture so far and the time, evaluated when the row is written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by `drive` and `pulse`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed goal is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => IHumanPosture.IGoal;

  /**
   * One limb driven toward a goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit, its value when absent and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The limb, the span written, the two goals and the weight between them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members; the origin is optional because the posture so far usually holds the goal to leave.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The limb is the posture's own limb key, so one type serves arms and legs.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and when it throws.
   * @evidence contracts/development/implementation.md#principled-implementation The origin is the stated one or the goal the posture so far holds, mixed with the asked goal by the weight of the second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One origin choice and one mix.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb with no goal to leave throws instead of starting from an invented one.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `mix`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is driven, for which limbs it is meant and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation Each second the driven goal replaces the limb's goal on the posture so far.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal written into one limb.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Writes its own limb only and leaves every other member of the posture as it is.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `toward`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the span written, the default origin and the scale's range.
   * @evidence contracts/development/implementation.md#principled-implementation A limb that goes and returns is the clock's envelope over a rise and a fall, scaled for a movement that stops short of its goal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `drive` with the scaled envelope as the weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent origin is left absent, so `toward` reads the posture's own goal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `drive` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
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
