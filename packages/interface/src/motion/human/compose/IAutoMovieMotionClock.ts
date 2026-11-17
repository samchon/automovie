import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";
import type { IAutoMovieMotionClockInstant } from "./IAutoMovieMotionClockInstant";

/**
 * An action clock resolving named instants and progress in seconds since that action starts. AutoMovieMotionClock constructs and admits the clock; action primitives share this capability.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An action clock resolving named instants and progress in seconds since that action starts. AutoMovieMotionClock constructs and admits the clock; action primitives share this capability.
 * @evidence contracts/development/design.md#principled-representation Progress between two named instants in the two forms a movement needs, uniform and minimum-jerk, plus the rise-and-fall envelope built from them and the instants as plan events.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMotionClock.of owns construction and named-window admission; all human action primitives consume the resulting clock instead of implementing separate timing maps.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The runtime constructor rejects repeated/reserved names and out-of-duration instants; query methods reject unknown names. This pure capability retains no validator metadata.
 */
export interface IAutoMovieMotionClock {
  /** Duration, seconds; positive. */
  duration: number;

  /** The named instants in time order, without `start` and `end`. */
  instants: readonly IAutoMovieMotionClockInstant[];

  /**
   * When an instant is.
   *
   * @param name The instant.
   * @returns Seconds since the action's start.
   * @throws {Error} On an unknown name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument, the unit, the origin of the seconds and the refusal of an unknown name.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: Looks the instant up by name in the clock's own map, so a window is stated by names and never by raw seconds.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: One lookup of the map built once by `of`; the windows of the other queries are resolved through it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: An unknown name throws instead of returning a default second.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: The clamped linear map of the seconds onto the window, the uniform form of progress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: One clamped division over the two instants `at` gives; `progress` is built on it, so the window rule exists once.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: A window of no length steps at its closing instant instead of dividing by zero.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: The minimum-jerk profile of the uniform progress (Flash and Hogan 1985): the bell-shaped speed of a point-to-point movement, at rest at both ends.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: One call of the engine's `minimumJerk` over `linear`, so the window rule is not restated.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: The profile is the cited one with no tuned constant, so a movement's shape is not fitted to a case.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: The progress of the rise less the progress of the fall, clamped at zero, so the value rises over one window and falls over a later one.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: Two calls of `progress` and one subtraction; the windows are not resolved a second time.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: The difference is clamped at zero instead of going negative when the fall window precedes the rise window.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: Each instant is its seconds over the duration, the form a plan's events take, in time order.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: One map over the sorted instants built by `of`; the plan's events are not kept as a second list.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature has no implementation; AutoMovieMotionClock.of supplies the runtime behavior described here: No instant is added or dropped; `start` and `end` are not named, as the clock's instants do not name them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  events(): IAutoMovieMotionEvent[];
}
