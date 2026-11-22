import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionPropHold,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanRideHands } from "./HumanRideHands";

/**
 * The lunge's hands over time (`HumanLunge`): which hand holds the line and which the whip, and how they change over at a change of rein.
 *
 * Before the change the first hand holds the line and the other the whip. Over the change's first `transition` the line hand brings the line in to the middle (the horse's ride moves the line there) while the whip hand comes to it and closes on the line `GAP` nearer the horse, the whip still in it; through the second both hold the line, and halfway through it the first hand, its palm on the line where the whip's handle runs back from the other fist, closes on the whip too, the other letting it go at the phase's end, so both hold it between and it is never unheld; over the third the first hand goes out with the whip to its side and the other keeps the line as the ride carries it out to that side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order of the change and where each hand is.
 * @evidence contracts/development/design.md#principled-representation The timeline as shares of the action and per-hand targets as blend weights.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanLunge`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The gap between the fists is a named provisional value.
 */
export namespace HumanLungeChange {
  /** The distance along the line between the two fists while both hold it, metres (provisional): a hand's breadth. */
  export const GAP: number = 0.1;

  /**
   * The hands' timeline.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Seconds since the action's start.
   * @evidence contracts/development/design.md#principled-representation The first line hand, the other, the change's start, the transition and the action's length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `HumanLunge`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITimeline {
    /** The hand that holds the line first. */
    line: AutoMovieHumanSide;

    /** The other hand, the whip's first. */
    other: AutoMovieHumanSide;

    /** Seconds since the start the change begins; none when absent. */
    change?: number;

    /** Seconds of each transition. */
    transition: number;

    /** The action's length. */
    seconds: number;
  }

  /**
   * One hand's target at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The line's share of the target against the whip's, and how far along the line toward the horse the fist closes, metres.
   * @evidence contracts/development/design.md#principled-representation A weight and a distance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `target`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITarget {
    /** 1 on the line, 0 on the whip's aim, between while moving from one to the other. */
    line: number;

    /** Metres along the line toward the horse. */
    along: number;
  }

  /**
   * A hand's target at a second.
   *
   * @param timeline The hands' timeline.
   * @param side The hand.
   * @param time Seconds since the action's start.
   * @returns Its target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The first hand stays on the line until the change's second phase ends, then goes out to the whip's aim on a minimum-jerk share; the other comes in from the whip's aim to the line `GAP` nearer the horse over the first phase and stays.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per hand and phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function target(
    timeline: ITimeline,
    side: AutoMovieHumanSide,
    time: number,
  ): ITarget {
    const { change, transition } = timeline;
    const phase = (start: number): number =>
      minimumJerk.share(Math.max(0, Math.min(1, (time - start) / transition)));
    if (side === timeline.line)
      return {
        line: change === undefined ? 1 : 1 - phase(change + 2 * transition),
        along: 0,
      };
    return change === undefined
      ? { line: 0, along: 0 }
      : { line: phase(change), along: GAP };
  }

  /**
   * How far a hand's fingers have closed on the line at a second.
   *
   * @param timeline The hands' timeline.
   * @param side The hand.
   * @param time Seconds since the action's start.
   * @returns The share, 0 open to 1 closed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The first hand closes over the take-up; a hand opens over the let-go only when it holds the line at the end: the first without a change, the other with one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One minimum-jerk share of the nearer transition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function closing(
    timeline: ITimeline,
    side: AutoMovieHumanSide,
    time: number,
  ): number {
    const { line, change, transition, seconds } = timeline;
    return minimumJerk.share(
      Math.min(
        1,
        side === line ? time / transition : 1,
        (side === line) === (change === undefined)
          ? (seconds - time) / transition
          : 1,
      ),
    );
  }

  /**
   * Whether a hand's line window is open at a second.
   *
   * @param timeline The hands' timeline.
   * @param side The hand.
   * @param time Seconds since the action's start.
   * @returns Whether it holds the line then.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The same windows `windows` declares, in seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison per hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function holds(
    timeline: ITimeline,
    side: AutoMovieHumanSide,
    time: number,
  ): boolean {
    const { line, change, transition, seconds } = timeline;
    return side === line
      ? time >= transition &&
          (change === undefined
            ? time <= seconds - transition
            : time <= change + 2 * transition)
      : change !== undefined &&
          time >= change + transition &&
          time <= seconds - transition;
  }

  /**
   * The line and whip grip windows and the whip's hold after the action.
   *
   * @param timeline The hands' timeline.
   * @param on The horse prop.
   * @param whip The whip prop, if any.
   * @returns The windows, shares of the action, and the hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The first hand grips the line from the take-up to the change's second phase end, the other from its first phase end to the let-go; the other hand grips the whip until the second phase ends and the first from halfway through it, so the whip passes while both fists are on the line and both hold it in between.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record per grip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records.
   */
  export function windows(
    timeline: ITimeline,
    on: string,
    whip: string | undefined,
  ): IWindows {
    const { line, other, change, transition, seconds } = timeline;
    const take: number = transition / seconds;
    const pass: number =
      change === undefined ? 1 - take : (change + 2 * transition) / seconds;
    const grip = (
      side: AutoMovieHumanSide,
      subject: string,
      from: number,
      to: number,
    ): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Hand`,
      kind: "grip",
      from,
      to,
      support: { kind: "prop", subject },
    });
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      grip(line, on, take, pass),
    ];
    if (change !== undefined)
      contacts.push(grip(other, on, (change + transition) / seconds, 1 - take));
    if (whip !== undefined) {
      contacts.push(grip(other, whip, 0, change === undefined ? 1 : pass));
      // Both fists hold the whip through the second phase's second half, so it is never unheld: the first hand closes on it there and the other lets it go at the phase's end.
      if (change !== undefined)
        contacts.push(
          grip(line, whip, (change + 1.5 * transition) / seconds, 1),
        );
    }
    return {
      contacts,
      holds:
        whip === undefined
          ? []
          : [
              {
                side: change === undefined ? other : line,
                prop: whip,
                from: 1,
              },
            ],
    };
  }

  /**
   * A hand's grip between the line and the whip's aim.
   *
   * @param line The line's grip for this hand.
   * @param aim The whip's grip for this hand.
   * @param target The hand's target.
   * @param out The horizontal direction from the centre toward the horse.
   * @returns The grip the hand closes on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blend.
   * @evidence contracts/development/implementation.md#principled-implementation The line's grip moved `along` the line toward the horse, then blended with the aim by the target's weight: points linearly, axis and normal linearly and renormalised, the axis turned to the aim's sense first; the line's palm frame is kept, so the palm meets either the same way.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Either end returned as it is, a blend between.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function grip(
    line: HumanRideHands.IMaterialGrip,
    aim: HumanRideHands.IMaterialGrip,
    target: ITarget,
    out: IAutoMovieVector3,
  ): HumanRideHands.IMaterialGrip {
    const axis: IAutoMovieVector3 = line.axis ?? out;
    const toward: IAutoMovieVector3 =
      Vector3.dot(axis, out) >= 0 ? axis : Vector3.scale(axis, -1);
    const held: HumanRideHands.IMaterialGrip =
      target.along === 0
        ? line
        : {
            ...line,
            point: Vector3.addScaled(line.point, toward, target.along),
          };
    if (target.line >= 1) return held;
    if (target.line <= 0) return { ...aim, reinPalm: line.reinPalm };
    const w: number = target.line;
    const sense: IAutoMovieVector3 =
      aim.axis === undefined || Vector3.dot(toward, aim.axis) >= 0
        ? toward
        : Vector3.scale(toward, -1);
    return {
      ...held,
      point: Vector3.lerp(aim.point, held.point, w),
      axis: Vector3.normalize(Vector3.lerp(aim.axis ?? sense, sense, w)),
      normal: Vector3.normalize(Vector3.lerp(aim.normal, held.normal, w)),
    };
  }

  /**
   * The grip windows and the hold of one action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Shares of the action.
   * @evidence contracts/development/design.md#principled-representation The plan's own records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `windows`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IWindows {
    /** The line and whip grips. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /** The whip's hold after the action. */
    holds: IAutoMovieMotionPropHold[];
  }
}
