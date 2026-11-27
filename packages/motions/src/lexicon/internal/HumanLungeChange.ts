import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionPropHold,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { HumanRideHands } from "./HumanRideHands";

/*
 * The lunge's hands over time (`HumanLunge`): which hand holds the line and
 * which the whip, and how they change over at a change of rein.
 *
 * Before the change the first hand holds the line and the other the whip. Over
 * the change's first `transition` the line hand brings the line in to the
 * middle (the horse's ride moves the line there) while the whip hand comes to
 * it and closes on the line `GAP` nearer the horse, the whip still in it;
 * through the second both hold the line, and halfway through it the first hand,
 * its palm on the line where the whip's handle runs back from the other fist,
 * closes on the whip too, the other letting it go at the phase's end, so both
 * hold it between and it is never unheld; over the third the first hand goes
 * out with the whip to its side and the other keeps the line as the ride
 * carries it out to that side.
 */
export namespace HumanLungeChange {
  /*
   * The distance along the line between the two fists while both hold it,
   * metres (provisional): a hand's breadth.
   */
  export const GAP: number = 0.1;

  /*
   * The hands' timeline.
   */
  export interface ITimeline {
    /*
     * The hand that holds the line first.
     */
    line: AutoMovieHumanSide;

    /*
     * The other hand, the whip's first.
     */
    other: AutoMovieHumanSide;

    /*
     * Seconds since the start the change begins; none when absent.
     */
    change?: number;

    /*
     * Seconds of each transition.
     */
    transition: number;

    /*
     * The action's length.
     */
    seconds: number;
  }

  /*
   * One hand's target at a second.
   */
  export interface ITarget {
    /*
     * 1 on the line, 0 on the whip's aim, between while moving from one to the
     * other.
     */
    line: number;

    /*
     * Metres along the line toward the horse.
     */
    along: number;
  }

  /*
   * A hand's target at a second.
   * Parameter timeline: The hands' timeline.
   * Parameter side: The hand.
   * Parameter time: Seconds since the action's start.
   * Returns: Its target.
   */
  export function target(
    timeline: ITimeline,
    side: AutoMovieHumanSide,
    time: number,
  ): ITarget {
    const { change, transition } = timeline;
    const phase = (start: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare(Math.max(0, Math.min(1, (time - start) / transition)));
    if (side === timeline.line)
      return {
        line: change === undefined ? 1 : 1 - phase(change + 2 * transition),
        along: 0,
      };
    return change === undefined
      ? { line: 0, along: 0 }
      : { line: phase(change), along: GAP };
  }

  /*
   * Refuse a change of hands that cannot happen.
   * Parameter change: Seconds since the start the change begins, if any.
   * Parameter whip: Whether the other hand holds a whip to pass.
   * Parameter transition: Seconds of each transition.
   * Parameter seconds: The action's length.
   * For a change without a whip, or one that does not
   * fit its three transitions after the take-up and before the let-go.
   */
  export function admit(
    change: number | undefined,
    whip: boolean,
    transition: number,
    seconds: number,
  ): void {
    if (
      change !== undefined &&
      (!whip || !(change >= transition && change + 4 * transition <= seconds))
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "change",
        value: change,
        feasible: {
          kind: "range",
          minimum: transition,
          maximum: seconds - 4 * transition,
          unit: "s",
        },
        reason:
          "a change of hands passes the whip and the line, over three transitions after the take-up and before the let-go",
        fix: "Give a whip, and a change at least one transition after the start and four before the end.",
      });
  }

  /*
   * How far a hand's fingers have closed on the line at a second.
   * Parameter timeline: The hands' timeline.
   * Parameter side: The hand.
   * Parameter time: Seconds since the action's start.
   * Returns: The share, 0 open to 1 closed.
   */
  export function closing(
    timeline: ITimeline,
    side: AutoMovieHumanSide,
    time: number,
  ): number {
    const { line, change, transition, seconds } = timeline;
    return AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(
        1,
        side === line ? time / transition : 1,
        (side === line) === (change === undefined)
          ? (seconds - time) / transition
          : 1,
      ),
    );
  }

  /*
   * Whether a hand's line window is open at a second.
   * Parameter timeline: The hands' timeline.
   * Parameter side: The hand.
   * Parameter time: Seconds since the action's start.
   * Returns: Whether it holds the line then.
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

  /*
   * The line and whip grip windows and the whip's hold after the action.
   * Parameter timeline: The hands' timeline.
   * Parameter on: The horse prop.
   * Parameter whip: The whip prop, if any.
   * Returns: The windows, shares of the action, and the hold.
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

  /*
   * A hand's grip between the line and the whip's aim.
   * Parameter line: The line's grip for this hand.
   * Parameter aim: The whip's grip for this hand.
   * Parameter target: The hand's target.
   * Parameter out: The horizontal direction from the centre toward the horse.
   * Returns: The grip the hand closes on.
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

  /*
   * The grip windows and the hold of one action.
   */
  export interface IWindows {
    /*
     * The line and whip grips.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /*
     * The whip's hold after the action.
     */
    holds: IAutoMovieMotionPropHold[];
  }
}
