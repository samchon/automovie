import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declare a foot that should remain planted over a sampled motion interval.
 *
 * @evidence contracts/common.md#principled-implementation The validator resolves the declared bone at inclusive sample times and compares successive horizontal displacement divided by elapsed seconds with the allowed speed, default 0.02 metres per second.
 * @evidence contracts/common.md#clear-and-simple-design Planted phase is an authored action fact, while the validator owns topology admission and sampled speed measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is discrete skate inspection rather than continuous contact or ground-support proof; any physicsIntent suppresses warnings, and malformed intervals/bones remain errors.
 * @evidence contracts/common.md#meaningful-documentation Documents seconds, ordered positive-duration windows, reachable bone and optional horizontal speed units/default.
 * @evidence contracts/performance.md#efficient-algorithms The data record is constant size; its consumer pays sampled pose resolution and adjacent-pair speed work over the window.
 * @evidence contracts/performance.md#reuse-equivalent-work The declared window is reused for its sampled points, with no inferred gait state or retained foot-motion cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the window, and validation retains sampled positions only for the call without host resources or running tasks.
 * @author Samchon
 */
export interface IAutoMovieFootContactWindow {
  /** Foot bone that should stay planted through the window. */
  bone: AutoMovieHumanoidBone;

  /** Inclusive finite start in seconds; negative starts are not refused. */
  start: number;

  /** Inclusive finite end in seconds, strictly greater than start. */
  end: number;

  /** Finite nonnegative horizontal speed in metres/second; omitted means 0.02. */
  maxHorizontalSpeed?: number;
}
