import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionClock } from "@automovie/interface";

/** Clock-driven whole-cycle oscillation with the original minimum-jerk ramps. */
export namespace AutoMovieMotionWave {
  /** Sample the original whole-cycle movement at actual action-local seconds. */
  export function sample(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    cycles: number,
    seconds: number,
  ): number {
    validate(cycles);
    const u: number = clock.linear(window[0], window[1], seconds);
    return signal(u, cycles, 1 / (2 * cycles));
  }

  /**
   * Prepare a fixed count/window while preserving the actual clock callback.
   *
   * @param clock The clock, including its own custom linear behavior.
   * @param window Fixed names, copied for this action's lifetime.
   * @param cycles Fixed positive whole count, admitted during preparation.
   * @returns A reader at actual action-local seconds with the same signal.
   */
  export function prepare(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    cycles: number,
  ): (seconds: number) => number {
    validate(cycles);
    const from: string = window[0];
    const to: string = window[1];
    const half: number = 1 / (2 * cycles);
    return (seconds: number): number =>
      signal(clock.linear(from, to, seconds), cycles, half);
  }
}

/** Keep the same count condition and refusal text for both entry points. */
function validate(cycles: number): void {
  if (!(cycles % 1 === 0 && cycles > 0))
    throw new Error("A movement repeats a positive whole number of times");
}

/** Preserve the original scalar ramp and sine product grouping exactly. */
function signal(u: number, cycles: number, half: number): number {
  const grown: number =
    minimumJerk.share(Math.min(1, u / half)) *
    minimumJerk.share(Math.min(1, (1 - u) / half));
  return grown * Math.sin(2 * Math.PI * cycles * u);
}
