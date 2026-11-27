import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionClock } from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";

/** The record of `IPrepareKneelClock`'s site. */
type IPrepareKneelClock = { name: string };

/**
 * Prepare the kneel's phase-start lookup while retaining the same eased
 * progress and its existing 1 ns phase-selection allowance.
 *
 * @param clock The unchanged phase clock.
 * @param phases Ordered records whose names exist on that clock.
 * @returns The active original phase, its index, its minimum-jerk progress `u`
 *   and its linear progress `linear` (the share of the phase's time, on which a
 *   swinging foot's lift is timed).
 */
export function prepareKneelClock<T extends IPrepareKneelClock>(
  clock: IAutoMovieMotionClock,
  phases: readonly T[],
): (seconds: number) => { phase: T; index: number; u: number; linear: number } {
  const starts: number[] = phases.map(
    (phase: T): number => clock.at(phase.name) - 1e-9,
  );
  const intervals: ReturnType<typeof AutoMovieMotionClock.prepare>[] =
    phases.map(
      (
        phase: T,
        index: number,
      ): ReturnType<typeof AutoMovieMotionClock.prepare> =>
        AutoMovieMotionClock.prepare(
          clock,
          phase.name,
          index + 1 < phases.length ? phases[index + 1]!.name : "end",
        ),
    );
  return (
    seconds: number,
  ): { phase: T; index: number; u: number; linear: number } => {
    let lo: number = 0;
    let hi: number = starts.length;
    while (lo < hi) {
      const mid: number = Math.floor((lo + hi) / 2);
      if (seconds >= starts[mid]!) lo = mid + 1;
      else hi = mid;
    }
    const index: number = Math.max(0, lo - 1);
    const phase: T = phases[index]!;
    const linear: number = intervals[index]!.linear(seconds);
    return {
      phase,
      index,
      u: AutoMovieEngineMotionSampling.minimumJerkShare(linear),
      linear,
    };
  };
}
