import { AutoMovieEngineMotionSampling } from "@automovie/engine";
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
    AutoMovieEngineMotionSampling.minimumJerkShare(linear(from, to, seconds));
  const envelope: IClock["envelope"] = (
    rise: readonly [string, string],
    fall: readonly [string, string],
    seconds: number,
  ): number =>
    Math.max(
      0,
      progress(rise[0], rise[1], seconds) - progress(fall[0], fall[1], seconds),
    );
  return {
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
  };
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
   * A fixed window's uniform and minimum-jerk readers, read through the clock's
   * own `linear` and `progress`, so a clock the author supplies keeps its own
   * timing law.
   *
   * @param clock The clock.
   * @param from The window's opening instant.
   * @param to The window's closing instant.
   * @returns The readers.
   */
  export function prepare(
    clock: Pick<IClock, "linear" | "progress">,
    from: string,
    to: string,
  ): AutoMovieMotionInterval.IPrepared {
    return {
      linear: (seconds: number): number => clock.linear(from, to, seconds),
      progress: (seconds: number): number => clock.progress(from, to, seconds),
    };
  }

  /**
   * A fixed rise and fall's envelope, read through the clock's own `envelope`,
   * so a clock the author supplies keeps its own timing law.
   *
   * @param clock The clock.
   * @param rise The rise's opening and closing instants.
   * @param fall The fall's opening and closing instants.
   * @returns The envelope at a second.
   */
  export function prepareEnvelope(
    clock: Pick<IClock, "envelope">,
    rise: readonly [string, string],
    fall: readonly [string, string],
  ): (seconds: number) => number {
    return (seconds: number): number => clock.envelope(rise, fall, seconds);
  }
}
/** The clock record, the interface's. */
type IClock = IAutoMovieMotionClock;

/** A named instant, the interface's. */
type IInstant = IAutoMovieMotionClockInstant;
