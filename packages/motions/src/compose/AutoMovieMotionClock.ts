import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionPhraseDurations,
} from "@automovie/interface";

import { AutoMovieMotionClockNative } from "./AutoMovieMotionClockNative";
import type { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";
import { AutoMovieMotionWave } from "./AutoMovieMotionWave";

/**
 * A clock from a duration and its named instants.
 *
 * @param duration Duration, seconds.
 * @param instants The named instants, in any order.
 * @returns The clock.
 * @throws {Error} On a duration that is not positive, a reserved or repeated
 *   name, or an instant outside the duration.
 */
export function AutoMovieMotionClock(
  duration: number,
  instants: readonly IAutoMovieMotionClockInstant[],
): IAutoMovieMotionClock {
  return AutoMovieMotionClockNative(duration, instants);
}

/**
 * The clock of one action: its duration and its named instants, and the only
 * owner of progress between two of them.
 *
 * A primitive asks the clock how far the action is between two instants and
 * never does window arithmetic of its own, so every channel of an action moves
 * on the same instants and a partner's action or an interrupt row reads the
 * same names. The shared names are Kendon's gesture phases with a contact
 * (Kendon 1980; McNeill 1992): `prepare`, `strokeStart`, `contact`,
 * `strokeEnd`, `retract`. A family adds its own (`chamber`, `takeoff`,
 * `landing`). `start` and `end` always exist, at 0 and at the duration.
 */
export namespace AutoMovieMotionClock {
  /** The instant every clock has at 0 seconds. */
  export const START: string = AutoMovieMotionClockNative.START;

  /** The instant every clock has at its duration. */
  export const END: string = AutoMovieMotionClockNative.END;

  /**
   * A fixed window's uniform and minimum-jerk readers, its two instants
   * resolved once.
   */
  export function prepare(
    clock: IAutoMovieMotionClock,
    from: string,
    to: string,
  ): AutoMovieMotionInterval.IPrepared {
    return AutoMovieMotionClockNative.prepare(clock, from, to);
  }

  /** A fixed rise and fall's envelope, each window's instants resolved once. */
  export function prepareEnvelope(
    clock: IAutoMovieMotionClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
  ): (seconds: number) => number {
    return AutoMovieMotionClockNative.prepareEnvelope(clock, rise, fall);
  }

  /**
   * A clock from phases laid end to end: each phase's name is the instant that
   * opens it, and the duration is the sum of the lengths.
   *
   * @param phases The phases in order.
   * @returns The clock.
   * @throws {Error} On a negative length, or what {@link of} refuses.
   */
  export function sequence(
    phases: readonly IAutoMovieMotionClockPhase[],
  ): IAutoMovieMotionClock {
    const instants: IAutoMovieMotionClockInstant[] = [];
    let seconds: number = 0;
    for (const phase of phases) {
      if (!(phase.seconds >= 0))
        throw new Error(`The phase "${phase.name}" has a negative length`);
      instants.push({ name: phase.name, seconds });
      seconds += phase.seconds;
    }
    return AutoMovieMotionClock(seconds, instants);
  }

  /**
   * The standard instants of a phrase in time order, between `start` and `end`:
   * the synchronisation points BML 1.0 gives every behaviour.
   */
  export const PHRASE: readonly [
    "ready",
    "strokeStart",
    "stroke",
    "strokeEnd",
    "relax",
  ] = ["ready", "strokeStart", "stroke", "strokeEnd", "relax"];

  /**
   * A clock with the standard instants of a phrase: `start`, `ready`,
   * `strokeStart`, `stroke` (the instant of contact or of greatest extent),
   * `strokeEnd`, `relax`, `end`. A phase of no length puts its two instants at
   * one time, so every phrase has every name and two actions can be aligned by
   * any of them.
   *
   * @param durations The six phase lengths.
   * @returns The clock.
   * @throws {Error} On a negative length, or a phrase of no length.
   */
  export function phrase(
    durations: IAutoMovieMotionPhraseDurations,
  ): IAutoMovieMotionClock {
    const lengths: readonly number[] = [
      durations.prepare,
      durations.wait ?? 0,
      durations.attack,
      durations.follow ?? 0,
      durations.hold ?? 0,
      durations.retract,
    ];
    const instants: IAutoMovieMotionClockInstant[] = [];
    let seconds: number = 0;
    lengths.forEach((length: number, i: number): void => {
      if (!(length >= 0))
        throw new Error("A phrase's phase has a negative length");
      seconds += length;
      if (i < PHRASE.length) instants.push({ name: PHRASE[i]!, seconds });
    });
    return AutoMovieMotionClock(seconds, instants);
  }

  /**
   * Phases laid end to end a number of times, for a movement that repeats (a
   * wave, a pump, a key press). Each repetition's phases are numbered from 1:
   * `down` and `up` repeated twice are `down1`, `up1`, `down2`, `up2`.
   *
   * @param span The phases of one repetition, in order.
   * @param count How many repetitions; a positive integer.
   * @returns The phases, for {@link sequence}.
   * @throws {Error} On a count that is not a positive integer.
   */
  export function repeat(
    span: readonly IAutoMovieMotionClockPhase[],
    count: number,
  ): IAutoMovieMotionClockPhase[] {
    if (!(Number.isInteger(count) && count > 0))
      throw new Error("A movement repeats a positive whole number of times");
    return Array.from(
      { length: count },
      (_: unknown, i: number): IAutoMovieMotionClockPhase[] =>
        span.map(
          (phase: IAutoMovieMotionClockPhase): IAutoMovieMotionClockPhase => ({
            name: `${phase.name}${i + 1}`,
            seconds: phase.seconds,
          }),
        ),
    ).flat();
  }

  /**
   * Progress of a movement that passes a point at speed: a minimum-jerk
   * movement from `from` to `to` scaled so it is 1 at `at`, the instant the
   * point is passed, and more than 1 after it. When `to` is at `at` the
   * movement is arrested at its peak speed (a fist met by a body): it is the
   * first half of a minimum-jerk movement, and stays 1 from then on.
   *
   * @param clock The clock.
   * @param window The instants the movement starts, passes the point and ends
   *   at.
   * @param seconds Seconds since the action's start.
   * @returns 0 until the start, 1 at the point, the overshoot's share after it.
   */
  export function through(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string, string],
    seconds: number,
  ): number {
    const a: number = clock.at(window[0]);
    const b: number = clock.at(window[1]);
    const c: number = clock.at(window[2]);
    if (b - a < 1e-12) return seconds >= b ? 1 : 0;
    const arrested: boolean = c - b < 1e-9;
    const k: number = arrested ? 0.5 : (b - a) / (c - a);
    const u: number =
      seconds <= b || arrested
        ? k * clock.linear(window[0], window[1], seconds)
        : k + (1 - k) * clock.linear(window[1], window[2], seconds);
    return minimumJerk.share(u) / minimumJerk.share(k);
  }

  /** The original clock-driven oscillation, owned by AutoMovieMotionWave.sample. */
  export const wave: typeof AutoMovieMotionWave.sample =
    AutoMovieMotionWave.sample;

  /**
   * Fixed wave constants with every actual custom clock.linear callback
   * preserved.
   */
  export const prepareWave: typeof AutoMovieMotionWave.prepare =
    AutoMovieMotionWave.prepare;
  /**
   * A clock with each of its spans stretched by a factor of its own. A span
   * runs from one instant to the next in time order and is named by the instant
   * that opens it; the first span is opened by `start`.
   *
   * @param clock The clock.
   * @param factor The factor of the span an instant opens; positive.
   * @returns The stretched clock, with the same instant names.
   * @throws {Error} On a factor that is not positive.
   */
  export function stretch(
    clock: IAutoMovieMotionClock,
    factor: (opening: string) => number,
  ): IAutoMovieMotionClock {
    const instants: IAutoMovieMotionClockInstant[] = [];
    let opening: string = START;
    let before: number = 0;
    let seconds: number = 0;
    const advance = (until: number): void => {
      const f: number = factor(opening);
      if (!(f > 0))
        throw new Error(
          `The span "${opening}" opens is stretched by a positive factor`,
        );
      seconds += f * (until - before);
      before = until;
    };
    for (const instant of clock.instants) {
      advance(instant.seconds);
      instants.push({ name: instant.name, seconds });
      opening = instant.name;
    }
    advance(clock.duration);
    return AutoMovieMotionClock(seconds, instants);
  }

  /**
   * A clock performed at another tempo: every span is stretched by the tempo
   * except the spans opened by the instants named in `fixed`, whose lengths
   * physics sets (a flight, a fall, a recoil) and no manner changes.
   *
   * @param clock The clock.
   * @param tempo The factor on every other span's length; positive, 1 for no
   *   change.
   * @param fixed The instants that open the spans left as they are; none when
   *   absent.
   * @returns The scaled clock, with the same instant names.
   * @throws {Error} On a tempo that is not positive, or a fixed name the clock
   *   lacks.
   */
  export function scale(
    clock: IAutoMovieMotionClock,
    tempo: number,
    fixed: readonly string[] = [],
  ): IAutoMovieMotionClock {
    for (const name of fixed) clock.at(name);
    return stretch(clock, (opening: string): number =>
      fixed.includes(opening) ? 1 : tempo,
    );
  }

  /**
   * A clock whose named instant falls on a given second: the spans before the
   * instant are stretched by one factor so it lands there, and the spans after
   * it keep their lengths. Two roles of a mutual action align their clocks to
   * the meeting's shared instant this way.
   *
   * @param clock The clock.
   * @param instant The instant to place.
   * @param seconds Where it falls, seconds since the action's start; positive.
   * @returns The aligned clock, with the same instant names.
   * @throws {Error} When the instant is at the action's start, or the second is
   *   not positive.
   */
  export function align(
    clock: IAutoMovieMotionClock,
    instant: string,
    seconds: number,
  ): IAutoMovieMotionClock {
    const at: number = clock.at(instant);
    if (!(at > 0) || !(seconds > 0))
      throw new Error(
        `The instant "${instant}" is aligned from a positive time to a positive time`,
      );
    const factor: number = seconds / at;
    let before: boolean = true;
    return stretch(clock, (opening: string): number => {
      if (opening !== START && clock.at(opening) >= at - 1e-12) before = false;
      return before ? factor : 1;
    });
  }
}
