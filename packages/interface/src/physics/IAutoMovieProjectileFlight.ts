import type { IAutoMovieProjectileDragInterval } from "./IAutoMovieProjectileDragInterval";
import type { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";

/**
 * A drag flight's reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents launch-relative sampling, retained integration chunks and the meaning of the speed bound.
 * @evidence contracts/development/design.md#principled-representation step is seconds and fastest is m/s, with Infinity when nonzero gravity acts without drag and no finite whole-flight bound exists.
 * @evidence contracts/development/design.md#minimal-and-owned-surface projectileDragFlight owns the integrator and its cached chunks; projectileFirstContact consumes interval/at and derives a finite search-span bound when fastest is infinite.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader is cached by projectile identity, so input data must stay unchanged; sampling does not expose or transfer the integration buffers.
 */
export interface IAutoMovieProjectileFlight {
  /** The integration step, seconds. */
  step: number;

  /** Whole-flight speed bound, m/s: the larger of launch and terminal speed with positive drag; Infinity for zero drag with nonzero gravity, and launch speed without either. A contact search uses a finite-interval bound when this is infinite. */
  fastest: number;

  /**
   * Read the actual cubic interval containing a nonnegative flight time.
   *
   * Nonfinite seconds throw RangeError; finite negative values select the first interval. Sampling grows the reader's retained integration chunks through the requested time and returns fresh endpoint states. Keep the source projectile unchanged while this identity-cached reader is used.
   *
   * @param seconds Seconds since launch; negative times select the first interval.
   * @returns Actual adjacent knot times with fresh endpoint states.
   */
  interval(seconds: number): IAutoMovieProjectileDragInterval;

  /**
   * The state at a second after the launch.
   *
   * Nonfinite launch-relative seconds throw RangeError; finite negatives return launch state. The reader retains integrated chunks for later reads and returns fresh world-metre position and m/s velocity. Keep the source projectile unchanged; releasing it and this reader permits their cached data to be collected.
   *
   * @param seconds Seconds since the launch; before it, the launch state.
   * @returns Position and velocity.
   */
  at(seconds: number): IAutoMovieProjectileState;
}
