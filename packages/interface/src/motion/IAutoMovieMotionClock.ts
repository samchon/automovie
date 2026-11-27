import type { IAutoMovieMotionEvent } from "./IAutoMovieMotionEvent";
import type { IAutoMovieMotionClockInstant } from "./IAutoMovieMotionClockInstant";

/**
 * An action clock resolving named instants and progress in seconds since that
 * action starts. motionClock constructs and admits the clock; action
 * primitives share this capability.
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
   */
  at(name: string): number;

  /**
   * Uniform progress between two instants.
   *
   * @param from The opening instant.
   * @param to The closing instant.
   * @param seconds Seconds since the action's start.
   * @returns 0 until `from`, 1 from `to`, linear between; a window of no length
   *   steps at `to`.
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
   */
  progress(from: string, to: string, seconds: number): number;

  /**
   * How present something is that rises over one window and falls over a later
   * one: the rise's progress less the fall's.
   *
   * @param rise The window it rises over.
   * @param fall The window it falls over.
   * @param seconds Seconds since the action's start.
   * @returns A value in [0, 1].
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
   */
  events(): IAutoMovieMotionEvent[];
}
