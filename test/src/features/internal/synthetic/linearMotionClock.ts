import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionEvent,
} from "@automovie/interface";

/**
 * A synthetic action clock whose progress is linear, for unit tests of a
 * function that reads a clock: its expected values follow from the window
 * shares alone, independent of the production clock's minimum-jerk curve.
 *
 * `start` is at 0 and `end` at the duration. `linear` and `progress` are both 0
 * until the window opens, 1 from its close and linear between; a window of no
 * length steps at its close. `envelope` is the rise's progress less the fall's.
 * An unknown instant name throws, as the clock contract states. The clock
 * admits nothing else: the caller gives a positive duration and instants inside
 * it.
 *
 * @param duration The duration, seconds.
 * @param instants The named instants, without `start` and `end`.
 * @returns The clock.
 */
export function linearMotionClock(
  duration: number,
  instants: readonly IAutoMovieMotionClockInstant[],
): IAutoMovieMotionClock {
  const sorted: IAutoMovieMotionClockInstant[] = [...instants].sort(
    (
      a: IAutoMovieMotionClockInstant,
      b: IAutoMovieMotionClockInstant,
    ): number => a.seconds - b.seconds,
  );
  const at: (name: string) => number = (name: string): number => {
    if (name === "start") return 0;
    if (name === "end") return duration;
    const found: IAutoMovieMotionClockInstant | undefined = sorted.find(
      (instant: IAutoMovieMotionClockInstant): boolean => instant.name === name,
    );
    if (found === undefined) throw new Error(`No instant named ${name}`);
    return found.seconds;
  };
  const linear: IAutoMovieMotionClock["linear"] = (
    from: string,
    to: string,
    seconds: number,
  ): number => {
    const a: number = at(from);
    const b: number = at(to);
    if (seconds >= b) return 1;
    if (seconds <= a) return 0;
    return (seconds - a) / (b - a);
  };
  return {
    duration,
    instants: sorted,
    at,
    linear,
    progress: linear,
    envelope: (
      rise: readonly [string, string],
      fall: readonly [string, string],
      seconds: number,
    ): number =>
      linear(rise[0], rise[1], seconds) - linear(fall[0], fall[1], seconds),
    events: (): IAutoMovieMotionEvent[] =>
      sorted.map(
        (instant: IAutoMovieMotionClockInstant): IAutoMovieMotionEvent => ({
          name: instant.name,
          share: instant.seconds / duration,
        }),
      ),
  };
}
