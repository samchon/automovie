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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a gaze brings onto a point, who owns the eye and head solution, the channel claimed and why the trunk is not recruited.
 * @evidence contracts/development/design.md#principled-representation A gaze is a target frame and a weight over a window on the head channel; the eye-head split is the gaze owner's law and is not restated here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One primitive (`look`) and one named time course over it (`glance`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The recruitment is a closed union and the trunk is excluded by the channel partition, not by a flag.
 */
export namespace AutoMovieMotionHumanGaze {
  /**
   * Which segments a gaze primitive may recruit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Says what the union decides.
   * @evidence contracts/development/design.md#principled-representation A gaze shift is made by the eyes alone or by the eyes and the head, the two cases the head channel can write.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by `look`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed literal union; the trunk is not a member because this primitive does not own it.
   */
  export type Recruit = "eyes" | "head";

  /**
   * What is looked at, as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each argument, when the function is called and the result's frame and unit.
   * @evidence contracts/development/design.md#principled-representation What is looked at may move or ride on the performer, so it is a function of the posture so far and the time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by both gaze primitives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed point is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => IAutoMovieVector3;

  /**
   * A gaze over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The span the head is written over, what is looked at, which segments join and how far they have gone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `look`; `glance` fills them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is a function of seconds and not a named easing.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, by what, and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation The gaze owner solves the eyes and the head for the target; the weight scales both shares alike and the trunk's share is 0, since the trunk is another channel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped to [0, 1], so an overshooting time course cannot turn the head past the target.
   * @evidence contracts/development/implementation.md#efficient-algorithms One gaze solution per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanGaze.aim`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
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
   * @param recruit Which segments may join; the head too by default.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the span written and the default recruitment.
   * @evidence contracts/development/implementation.md#principled-implementation A gaze that goes and returns is the clock's envelope over a rise and a fall, which leaves and rejoins the base without a jump.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `look` with the envelope as the weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The windows are named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `look` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
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
