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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Nonfinite seconds throw RangeError; finite negative values select the first interval. Sampling grows the reader's retained integration chunks through the requested time and returns fresh endpoint states. Keep the source projectile unchanged while this identity-cached reader is used.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; projectileDragFlight owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; projectileDragFlight owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in projectileDragFlight.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; projectileDragFlight owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; projectileDragFlight owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; projectileDragFlight and the documented reader/caller lifetime own retained data and release.
   */
  interval(seconds: number): IAutoMovieProjectileDragInterval;

  /**
   * The state at a second after the launch.
   *
   * Nonfinite launch-relative seconds throw RangeError; finite negatives return launch state. The reader retains integrated chunks for later reads and returns fresh world-metre position and m/s velocity. Keep the source projectile unchanged; releasing it and this reader permits their cached data to be collected.
   *
   * @param seconds Seconds since the launch; before it, the launch state.
   * @returns Position and velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Nonfinite launch-relative seconds throw RangeError; finite negatives return launch state. The reader retains integrated chunks for later reads and returns fresh world-metre position and m/s velocity. Keep the source projectile unchanged; releasing it and this reader permits their cached data to be collected.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; projectileDragFlight owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; projectileDragFlight owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in projectileDragFlight.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; projectileDragFlight owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; projectileDragFlight owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; projectileDragFlight and the documented reader/caller lifetime own retained data and release.
   */
  at(seconds: number): IAutoMovieProjectileState;
}
