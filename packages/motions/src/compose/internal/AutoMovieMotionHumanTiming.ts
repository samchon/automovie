import type {
  IAutoMovieMotionHumanTiming,
  IAutoMovieMotionPhraseDurations,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";

/**
 * The time of a movement to a place, by the rule the place asks for.
 *
 * @param distance Metres travelled.
 * @param place Whether the place is solid, and its width when it has one.
 * @returns Seconds.
 */
export function AutoMovieMotionHumanTiming(
  distance: number,
  place: IAutoMovieMotionHumanTiming.IOfPlace,
): number {
  return place.solid && place.width !== undefined
    ? AutoMovieMotionHumanTiming.aimed(distance, place.width)
    : AutoMovieMotionHumanTiming.transport(distance);
}

/**
 * How long an effector takes to travel a distance.
 *
 * Two rules, and which one a movement takes:
 *
 * - {@link AutoMovieMotionHumanTiming.transport}: a movement in free space (a
 *   gesture's preparation, a hand to a rest place, a retraction) lasts `0.25 +
 *   0.5 D` seconds for `D` metres. Provisional: a gesture's preparation lasts a
 *   few tenths of a second and reaching time grows with distance (Fitts 1954).
 * - {@link AutoMovieMotionHumanTiming.aimed}: a movement that must stop on a
 *   target of a given width lasts `a + b lg A + c W` for an amplitude `A` in
 *   millimetres and a width `W`, the two-factor model McIntosh, Mon-Williams
 *   and Tresilian (2018, J. Exp. Psychol. Hum. Percept. Perform. 44:1022,
 *   table
 *
 *   1. Fitted to reach-to-grasp times, with a = -306.07 ms, b = 297.27 ms per decade
 *        and c = 0.65 ms per millimetre (r^2 = 0.97). Amplitudes below the
 *        study's shortest (170 mm) take its value, since the fit is not valid
 *        there.
 *
 * {@link AutoMovieMotionHumanTiming.of} chooses: a place that is solid and has a
 * width is aimed at, any other is travelled to.
 */
export namespace AutoMovieMotionHumanTiming {
  /** The free-space rule's time at no distance, seconds (provisional). */
  export const BASE: number = 0.25;

  /** The free-space rule's seconds per metre (provisional). */
  export const RATE: number = 0.5;

  /** McIntosh et al. 2018 two-factor intercept, seconds. */
  export const INTERCEPT: number = -0.30607;

  /** McIntosh et al. 2018 amplitude slope, seconds per decade of millimetres. */
  export const AMPLITUDE: number = 0.29727;

  /** McIntosh et al. 2018 width slope, seconds per metre (0.65 ms per mm). */
  export const WIDTH: number = 0.65;

  /** The shortest amplitude the fit was measured at, metres. */
  export const SHORTEST: number = 0.17;

  /**
   * The time of a movement in free space.
   *
   * @param distance Metres travelled.
   * @returns Seconds.
   */
  export function transport(distance: number): number {
    return BASE + RATE * Math.max(0, distance);
  }

  /**
   * The time of a movement that stops on a target.
   *
   * @param distance Metres travelled.
   * @param width The target's width across the grip or the touch, metres; 0 for
   *   a point.
   * @returns Seconds.
   */
  export function aimed(distance: number, width: number): number {
    return (
      INTERCEPT +
      AMPLITUDE * Math.log10(1000 * Math.max(SHORTEST, distance)) +
      WIDTH * Math.max(0, width)
    );
  }

  /** The pauses of {@link IAutoMovieMotionHumanTiming.Pause}, as data. */
  export const PAUSE_NAMES = [
    "none",
    "brief",
    "beat",
    "long",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanTiming.Pause>[];

  /**
   * The seconds of each pause (provisional): `none` is no time, `brief` 0.15
   * (an interrupt's smooth blend), `beat` 0.4 (one swing of the `wave` gesture
   * and the flinch's return), `long` 0.8 (the hold of a posture gesture such as
   * `slump`).
   */
  export const PAUSES: Readonly<
    Record<IAutoMovieMotionHumanTiming.Pause, number>
  > = {
    none: 0,
    brief: 0.15,
    beat: 0.4,
    long: 0.8,
  };

  /**
   * The seconds of a span.
   *
   * @param span The span, on any rung.
   * @returns Seconds.
   * @throws {Error} When a scale lies outside [0.5, 1.5], explicit seconds are
   *   negative or not finite, or an explicit source is empty.
   */
  export function seconds(span: IAutoMovieMotionHumanTiming.Span): number {
    if (typeof span === "string") return PAUSES[span];
    if ("distance" in span)
      return span.width === undefined
        ? transport(span.distance)
        : aimed(span.distance, span.width);
    if ("pause" in span) {
      HumanBound.within("pause.scale", span.scale, 0.5, 1.5);
      return PAUSES[span.pause] * span.scale;
    }
    if (span.source.trim() === "")
      throw new Error("Explicit seconds state their source");
    HumanBound.least("seconds", span.seconds, 0, "s");
    return span.seconds;
  }

  /**
   * The action clock's phrase of a set of roles.
   *
   * @param roles The phases by role.
   * @returns The phrase, in seconds; a hold or a decay left out stays out.
   * @throws {Error} When a span is refused by `seconds`.
   */
  export function phrase(
    roles: IAutoMovieMotionHumanTiming.IRoles,
  ): IAutoMovieMotionPhraseDurations {
    return {
      prepare: seconds(roles.prepare),
      ...(roles.wait !== undefined ? { wait: seconds(roles.wait) } : {}),
      attack: seconds(roles.attack),
      ...(roles.follow !== undefined ? { follow: seconds(roles.follow) } : {}),
      ...(roles.hold !== undefined ? { hold: seconds(roles.hold) } : {}),
      retract: seconds(roles.retract),
    };
  }
}
