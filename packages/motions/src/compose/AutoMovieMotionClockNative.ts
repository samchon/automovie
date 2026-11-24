import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionEvent,
} from "@automovie/interface";

import { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";

/** Construct a validated clock. */
export function AutoMovieMotionClockNative(
  duration: number,
  instants: readonly IInstant[],
): IClock {
  if (!(duration > 0)) throw new Error("A clock lasts a positive time");
  const times: Map<string, number> = new Map([
    [AutoMovieMotionClockNative.START, 0],
    [AutoMovieMotionClockNative.END, duration],
  ]);
  for (const instant of instants) {
    if (times.has(instant.name))
      throw new Error(`A clock names "${instant.name}" once`);
    if (!(instant.seconds >= 0 && instant.seconds <= duration + 1e-9))
      throw new Error(
        `The instant "${instant.name}" lies outside the clock's duration`,
      );
    times.set(instant.name, Math.min(duration, instant.seconds));
  }
  const sorted: IInstant[] = instants
    .map(
      (i: IInstant): IInstant => ({
        name: i.name,
        seconds: times.get(i.name)!,
      }),
    )
    .sort((a: IInstant, b: IInstant): number => a.seconds - b.seconds);
  const at = (name: string): number => {
    const seconds: number | undefined = times.get(name);
    if (seconds === undefined)
      throw new Error(`The clock has no instant "${name}"`);
    return seconds;
  };
  const linear = (from: string, to: string, seconds: number): number =>
    AutoMovieMotionInterval.linear(at(from), at(to), seconds);
  const progress = (from: string, to: string, seconds: number): number =>
    minimumJerk.share(linear(from, to, seconds));
  const envelope: IClock["envelope"] = (
    rise: readonly [string, string],
    fall: readonly [string, string],
    seconds: number,
  ): number =>
    Math.max(
      0,
      progress(rise[0], rise[1], seconds) - progress(fall[0], fall[1], seconds),
    );
  return new NativeClock({
    duration,
    instants: sorted,
    at,
    linear,
    progress,
    envelope,
    events: (): IAutoMovieMotionEvent[] =>
      sorted.map(
        (i: IInstant): IAutoMovieMotionEvent => ({
          name: i.name,
          share: i.seconds / duration,
        }),
      ),
  });
}

/**
 * Clock construction and the readers that resolve a fixed window's two instants
 * once for every sample read on it.
 */
export namespace AutoMovieMotionClockNative {
  /** Every action's opening name, at zero seconds. */
  export const START: string = "start";

  /** Every action's closing name, at its duration. */
  export const END: string = "end";

  /**
   * A fixed window's uniform and minimum-jerk readers, its two instants
   * resolved at the first native sample and kept for the rest. A custom clock's
   * requested callback owns each read.
   */
  export function prepare(
    clock: IClock,
    from: string,
    to: string,
  ): AutoMovieMotionInterval.IPrepared {
    const original: IClock | undefined = NativeClock.original(clock);
    if (original === undefined)
      return {
        linear: (seconds: number): number => clock.linear(from, to, seconds),
        progress: (seconds: number): number =>
          clock.progress(from, to, seconds),
      };
    let ready: AutoMovieMotionInterval.IPrepared | undefined;
    const interval = (): AutoMovieMotionInterval.IPrepared =>
      (ready ??= AutoMovieMotionInterval.prepare(original, from, to));
    return {
      linear: (seconds: number): number => {
        const read: IClock["linear"] = clock.linear;
        return read === original.linear
          ? interval().linear(seconds)
          : Reflect.apply(read, clock, [from, to, seconds]);
      },
      progress: (seconds: number): number => {
        const read: IClock["progress"] = clock.progress;
        return read === original.progress
          ? interval().progress(seconds)
          : Reflect.apply(read, clock, [from, to, seconds]);
      },
    };
  }

  /**
   * A fixed rise and fall's envelope, each window's instants resolved at its
   * first native use and kept for the rest. A custom clock receives its own two
   * name tuples at every requested sample.
   */
  export function prepareEnvelope(
    clock: IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
  ): (seconds: number) => number {
    const riseFrom: string = rise[0];
    const riseTo: string = rise[1];
    const fallFrom: string = fall[0];
    const fallTo: string = fall[1];
    const original: IClock | undefined = NativeClock.original(clock);
    if (original === undefined)
      return (seconds: number): number =>
        clock.envelope([riseFrom, riseTo], [fallFrom, fallTo], seconds);
    let rising: AutoMovieMotionInterval.IPrepared | undefined;
    let falling: AutoMovieMotionInterval.IPrepared | undefined;
    return (seconds: number): number => {
      const read: IClock["envelope"] = clock.envelope;
      if (read !== original.envelope)
        return Reflect.apply(read, clock, [
          [riseFrom, riseTo],
          [fallFrom, fallTo],
          seconds,
        ]);

      rising ??= AutoMovieMotionInterval.prepare(original, riseFrom, riseTo);
      const grown: number = rising.progress(seconds);
      falling ??= AutoMovieMotionInterval.prepare(original, fallFrom, fallTo);
      return Math.max(0, grown - falling.progress(seconds));
    };
  }
}

/** The clock record, the interface's. */
type IClock = IAutoMovieMotionClock;

/**
 * Distinguishes factory clocks without probing a custom clock or retaining a
 * registry.
 */
class NativeClock {
  /** Constructor-owned queries, also used as the factory's private brand. */
  readonly #original: IClock;

  /**
   * Duration and public readers are assigned as own properties by the
   * constructor.
   */
  declare duration: IClock["duration"];
  declare instants: IClock["instants"];
  declare at: IClock["at"];
  declare linear: IClock["linear"];
  declare progress: IClock["progress"];
  declare envelope: IClock["envelope"];
  declare events: IClock["events"];

  /** Move the factory's public fields and closures onto the branded record. */
  public constructor(clock: IClock) {
    this.#original = clock;
    Object.assign(this, clock);
  }

  /** Read the original queries only on the actual factory receiver. */
  public static original(clock: IClock): IClock | undefined {
    return #original in clock ? clock.#original : undefined;
  }
}

/** A named instant, the interface's. */
type IInstant = IAutoMovieMotionClockInstant;
