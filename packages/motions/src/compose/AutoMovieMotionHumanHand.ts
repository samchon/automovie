import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Hand primitives: the fingers and the thumb of one hand formed into a shape,
 * on the hand's own channel, whatever its arm does (a fist clenched at the
 * side, a point held while the arm swings, fingers spread in surprise).
 *
 * A hand at weight 0 is the relaxed cascade and at weight 1 the asked shape;
 * between, every segment's flexion is the weighted mean of the two.
 */
export namespace AutoMovieMotionHumanHand {
  /** One hand's shaping over a window. */
  export interface IShape {
    /** The hand. */
    side: HumanHand.Side;

    /** The shape at weight 1. */
    shape: HumanHand.Shape;

    /** Extra flexion of every finger joint over the shape, degrees; 0 when absent. */
    curl?: number;

    /** Seconds since the action's start from which the hand is written. */
    from: number;

    /** Seconds since the action's start until which the hand is written. */
    to: number;

    /**
     * How far the hand is from the relaxed cascade to the shape.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /**
   * The finger joints of a hand on its way to a shape.
   *
   * @param side The hand.
   * @param shape The shape at weight 1.
   * @param curl Extra flexion of the fingers over the shape, degrees.
   * @param weight How far from the relaxed cascade to the shape, in [0, 1].
   * @returns Angles for every finger and thumb segment of that hand.
   */
  export function fingers(
    side: HumanHand.Side,
    shape: HumanHand.Shape,
    curl: number,
    weight: number,
  ): IHumanPosture["joints"] {
    const asked: IHumanPosture["joints"] = HumanHand.shape(side, shape);
    const relaxed: IHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
    const out: IHumanPosture["joints"] = {};
    for (const bone of Object.keys(asked) as AutoMovieHumanoidBone[]) {
      const a: number = asked[bone]![0] + (bone.includes("Thumb") ? 0 : curl);
      const r: number = relaxed[bone]![0];
      out[bone] = [r + (a - r) * weight, 0, 0];
    }
    return out;
  }

  /**
   * A hand shaped by a weight.
   *
   * @param props The hand, the shape, the window and the weight.
   * @returns The primitive, on the hand's channel.
   */
  export function shape(props: IShape): IAutoMovieMotionHumanPrimitive {
    return {
      channels: [`${props.side}Hand`],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        joints: {
          ...posture.joints,
          ...fingers(
            props.side,
            props.shape,
            props.curl ?? 0,
            Math.min(1, Math.max(0, props.weight(seconds))),
          ),
        },
      }),
    };
  }

  /**
   * A hand formed into a shape and released: the weight rises over one window
   * and falls over another on the clock's envelope, and the hand is written
   * from the first instant to the last.
   *
   * @param clock The action's clock.
   * @param side The hand.
   * @param rise The instants the shape starts forming and is formed at.
   * @param fall The instants the shape starts releasing and is released at.
   * @param form The shape.
   * @param curl Extra flexion of the fingers over the shape, degrees.
   * @returns The primitive.
   */
  export function form(
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    rise: readonly [string, string],
    fall: readonly [string, string],
    form: HumanHand.Shape,
    curl: number = 0,
  ): IAutoMovieMotionHumanPrimitive {
    return shape({
      side,
      shape: form,
      curl,
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      weight: (seconds: number): number => clock.envelope(rise, fall, seconds),
    });
  }
}
