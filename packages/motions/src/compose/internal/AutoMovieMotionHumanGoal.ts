import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

/*
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
export namespace AutoMovieMotionHumanGoal {
  /*
   * A goal a share of the way from one goal to another.
   * Parameter from: The goal at weight 0.
   * Parameter to: The goal at weight 1.
   * Parameter weight: How far, clamped to [0, 1].
   * Returns: `from` at 0, `to` at 1, and the mixed goal between.
   * When the goals are attached to different frames.
   */
  export function mix(
    from: IAutoMovieHumanLimbGoal,
    to: IAutoMovieHumanLimbGoal,
    weight: number,
  ): IAutoMovieHumanLimbGoal {
    const s: number = Math.min(1, Math.max(0, weight));
    if (s <= 0) return from;
    if (s >= 1) return to;
    if (from.on !== to.on)
      throw new Error(
        `A limb goal on ${from.on ?? "the world"} cannot be mixed with one on ${to.on ?? "the world"}`,
      );
    return {
      point: AutoMovieEngineVector3.lerp(from.point, to.point, s),
      bend: AutoMovieEngineVector3.lerp(from.bend, to.bend, s),
      ...(to.rotation === undefined
        ? from.rotation === undefined
          ? {}
          : { rotation: from.rotation }
        : {
            rotation: AutoMovieEngineQuaternion.slerp(
              from.rotation ?? to.rotation,
              to.rotation,
              s,
            ),
          }),
      ...(to.contact === undefined ? {} : { contact: to.contact }),
      ...(to.limits === undefined ? {} : { limits: to.limits }),
      ...(to.on === undefined ? {} : { on: to.on }),
      ...(to.reference === undefined ? {} : { reference: to.reference }),
    };
  }

  /*
   * The goal of a limb driven toward a goal at a second.
   * Parameter props: The limb, its goal, its origin and its weight.
   * Parameter posture: The posture so far at this second.
   * Parameter seconds: Seconds since the action's start.
   * Returns: The goal.
   * When no origin is given and the posture holds no goal for
   * the limb.
   */
  export function toward(
    props: IAutoMovieMotionHumanGoal.IToward,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieHumanLimbGoal {
    const origin: IAutoMovieHumanLimbGoal | undefined =
      props.origin === undefined
        ? posture.limbs[props.limb]
        : props.origin(posture, seconds);
    if (origin === undefined)
      throw new Error(
        `The ${props.limb} has no goal to leave; give the primitive an origin`,
      );
    return mix(origin, props.goal(posture, seconds), props.weight(seconds));
  }

  /*
   * A limb driven toward a goal by a weight: the primitive for the limbs an
   * action places by a goal of its own making (a fist on a striking path, a
   * glove before the face, a foot on a kick's arc).
   * Parameter props: The limb, its window, its goal, its origin and its weight.
   * Returns: The primitive, on the limb's channel.
   */
  export function drive(
    props: IAutoMovieMotionHumanGoal.IToward,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: [props.limb],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          [props.limb]: toward(props, posture, seconds),
        },
      }),
    };
  }

  /*
   * A limb taken to a goal and brought back: the goal's share rises over one
   * window and falls over another on the clock's envelope, and the limb is
   * written from the first instant to the last.
   * Parameter clock: The action's clock.
   * Parameter limb: The limb.
   * Parameter rise: The instants the limb leaves its origin and arrives at.
   * Parameter fall: The instants the limb starts back and is back at.
   * Parameter goal: The goal at the envelope's full share.
   * Parameter origin: The goal left and returned to; the posture's own when absent.
   * Parameter size: The envelope's scale, in (0, 1]; 1 when absent.
   * Returns: The primitive.
   */
  export function pulse(
    clock: IAutoMovieMotionClock,
    limb: AutoMovieHumanLimb,
    rise: readonly [string, string],
    fall: readonly [string, string],
    goal: IAutoMovieMotionHumanGoal.Frame,
    origin?: IAutoMovieMotionHumanGoal.Frame,
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
