import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";

/**
 * A clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its arguments, its unit, its value outside the window and what it throws.
 * @evidence contracts/development/design.md#principled-representation Progress between two named instants in the two forms a movement needs, uniform and minimum-jerk, plus the rise-and-fall envelope built from them and the instants as plan events.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five queries over two data members; every window computation of an action goes through them, so no primitive owns one.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Windows are pairs of names checked against the clock, never raw seconds, and no member is optional.
 */
export interface IAutoMovieMotionClock {
  /** Duration, seconds; positive. */
  duration: number;

  /** The named instants in time order, without `start` and `end`. */
  instants: readonly AutoMovieMotionClock.IInstant[];

  /**
   * When an instant is.
   *
   * @param name The instant.
   * @returns Seconds since the action's start.
   * @throws {Error} On an unknown name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument, the unit, the origin of the seconds and the refusal of an unknown name.
   * @evidence contracts/development/implementation.md#principled-implementation Looks the instant up by name in the clock's own map, so a window is stated by names and never by raw seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of the map built once by `of`; the windows of the other queries are resolved through it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown name throws instead of returning a default second.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  at(name: string): number;

  /**
   * Uniform progress between two instants.
   *
   * @param from The opening instant.
   * @param to The closing instant.
   * @param seconds Seconds since the action's start.
   * @returns 0 until `from`, 1 from `to`, linear between; a window of no length steps at `to`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two instants, the argument, the value before, inside and after the window and the step of a window with no length.
   * @evidence contracts/development/implementation.md#principled-implementation The clamped linear map of the seconds onto the window, the uniform form of progress.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamped division over the two instants `at` gives; `progress` is built on it, so the window rule exists once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A window of no length steps at its closing instant instead of dividing by zero.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  linear(from: string, to: string, seconds: number): number;

  /**
   * Minimum-jerk progress between two instants (Flash and Hogan 1985): the
   * bell-shaped speed of a point-to-point movement, at rest at both ends.
   *
   * @param from The opening instant.
   * @param to The closing instant.
   * @param seconds Seconds since the action's start.
   * @returns 0 until `from`, 1 from `to`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two instants, the argument, the value outside the window and the profile (Flash and Hogan 1985).
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk profile of the uniform progress (Flash and Hogan 1985): the bell-shaped speed of a point-to-point movement, at rest at both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the engine's `minimumJerk` over `linear`, so the window rule is not restated.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The profile is the cited one with no tuned constant, so a movement's shape is not fitted to a case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  progress(from: string, to: string, seconds: number): number;

  /**
   * How present something is that rises over one window and falls over a
   * later one: the rise's progress less the fall's.
   *
   * @param rise The window it rises over.
   * @param fall The window it falls over.
   * @param seconds Seconds since the action's start.
   * @returns A value in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the argument and the range of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The progress of the rise less the progress of the fall, clamped at zero, so the value rises over one window and falls over a later one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two calls of `progress` and one subtraction; the windows are not resolved a second time.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The difference is clamped at zero instead of going negative when the fall window precedes the rise window.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  envelope(
    rise: readonly [string, string],
    fall: readonly [string, string],
    seconds: number,
  ): number;

  /**
   * The instants as plan events.
   *
   * @returns One event per named instant, as a share of the duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that every named instant is returned once and as a share of the duration.
   * @evidence contracts/development/implementation.md#principled-implementation Each instant is its seconds over the duration, the form a plan's events take, in time order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the sorted instants built by `of`; the plan's events are not kept as a second list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No instant is added or dropped; `start` and `end` are not named, as the clock's instants do not name them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  events(): IAutoMovieMotionEvent[];
}


