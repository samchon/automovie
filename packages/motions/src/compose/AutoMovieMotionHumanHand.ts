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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the primitives write, on which channel, and what the weight's two ends and its middle are.
 * @evidence contracts/development/design.md#principled-representation A hand shape is a set of segment flexions, so a hand on its way to a shape is their weighted mean with the resting hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interpolation (`fingers`), one primitive (`shape`) and one named time course (`form`); the arm primitives read `fingers` so the rule exists once.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand owner's shape vocabulary and angles; no shape is defined here.
 */
export namespace AutoMovieMotionHumanHand {
  /**
   * One hand's shaping over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The span the hand is written over, the shape it goes to and how far it has gone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `shape`; `form` fills them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is a function of seconds and not a named easing.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and range and what the result covers.
   * @evidence contracts/development/implementation.md#principled-implementation Each segment's flexion is the weighted mean of the relaxed cascade's and the asked shape's; the curl is added to the fingers of the asked shape.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the shape's bones.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The curl is not added to the thumb, whose flexion axis closes across the palm and not with the fingers.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the hand's fifteen segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads both shapes from `HumanHand.shape`, their owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is shaped, by what, and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation The finger joints of the weighted shape replace the hand's own in the posture's joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp and one joint update.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped to [0, 1], so an overshooting time course cannot bend a finger past its shape.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `fingers`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
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
   * @param asked The shape.
   * @param curl Extra flexion of the fingers over the shape, degrees; 0 by default.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the span written and the default curl.
   * @evidence contracts/development/implementation.md#principled-implementation A shape formed and released is the clock's envelope over a rise and a fall.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `shape` with the envelope as the weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The windows are named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `shape` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function form(
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    rise: readonly [string, string],
    fall: readonly [string, string],
    asked: HumanHand.Shape,
    curl: number = 0,
  ): IAutoMovieMotionHumanPrimitive {
    return shape({
      side,
      shape: asked,
      curl,
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      weight: (seconds: number): number => clock.envelope(rise, fall, seconds),
    });
  }
}
