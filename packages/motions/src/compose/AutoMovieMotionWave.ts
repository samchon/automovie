import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionClock } from "@automovie/interface";


/**
 * Clock-driven whole-cycle oscillation with the original minimum-jerk ramps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns exact count admission, clock callback semantics, normalized wave shape and prepared fixed constants.
 * @evidence contracts/development/design.md#principled-representation A whole-cycle sine rises/falls over half-cycle minimum-jerk windows; actual progress remains supplied by the caller's clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Cold sampling and fixed-count preparation share one signal and validator; the existing Clock facade and Head consumer keep their vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No clock callback, time sample, motion value or alternative easing is cached or substituted.
 */
export namespace AutoMovieMotionWave {
  /**
   * Sample the original whole-cycle movement at actual action-local seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns the original ramped sine from the actual named-window linear progress; cycles must be a positive integer and keep their original error.
   * @evidence contracts/development/implementation.md#principled-implementation Whole cycles meet zero at the endpoints; the product of original half-cycle minimum-jerk ramps brings speed to zero there, using the same scalar polynomial owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Count admission precedes the actual clock callback, then the shared signal owner evaluates both ramps and sine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Count check/error, custom clock.linear invocation, half=1/(2*cycles), ramp argument grouping and final product remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant count/clock dispatch, two scalar minimum-jerk reads and one sine per actual sample; no derivative records are built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold and prepared entry points use the same exact signal owner; no sample value is shared across seconds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A cold call retains no clock, input, output or handle.
   */
  export function sample(clock: IAutoMovieMotionClock, window: readonly [string, string],
    cycles: number, seconds: number): number {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed count/names, eager count admission and current custom callback behavior at each actual second.
   * @evidence contracts/development/implementation.md#principled-implementation Count validity and half-cycle width depend only on the fixed count, while every current clock.linear invocation remains necessary for a custom clock's behavior/effects.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One count check and copied names feed the same signal owner; no native-clock assumption or copied wave law appears in Head.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every requested second still invokes clock.linear with its original receiver and current method; waveform grouping, count rule and error text are unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Across Q reads one count check and half-width division replace Q repetitions; all current clock/progress, two scalar ramp and sine work remains, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only immutable count, half-width and copied names are shared. World progress and custom clock callback results are always evaluated normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned action reader retains one clock and three scalar/name constants until release, without a time/result history or external handle.
   */
  export function prepare(clock: IAutoMovieMotionClock, window: readonly [string, string],
    cycles: number): (seconds: number) => number {
    validate(cycles);
    const from: string = window[0];
    const to: string = window[1];
    const half: number = 1 / (2 * cycles);
    return (seconds: number): number => signal(clock.linear(from, to, seconds), cycles, half);
  }
}

/** Keep the same count condition and refusal text for both entry points. */
function validate(cycles: number): void {
  if (!(Number.isInteger(cycles) && cycles > 0))
    throw new Error("A movement repeats a positive whole number of times");
}

/** Preserve the original scalar ramp and sine product grouping exactly. */
function signal(u: number, cycles: number, half: number): number {
  const grown: number = minimumJerk.share(Math.min(1, u / half)) *
    minimumJerk.share(Math.min(1, (1 - u) / half));
  return grown * Math.sin(2 * Math.PI * cycles * u);
}
