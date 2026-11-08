import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declare a foot that should remain planted over a sampled motion interval.
 *
 * @evidence contracts/development/design.md#principled-representation The validator resolves the declared bone at inclusive sample times and compares successive horizontal displacement divided by elapsed seconds with the allowed speed, default 0.02 metres per second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Planted phase is an authored action fact, while the validator owns topology admission and sampled speed measurement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This is discrete skate inspection rather than continuous contact or ground-support proof; any physicsIntent suppresses warnings, and malformed intervals/bones remain errors.
 * @evidence contracts/development/common.md#meaningful-documentation Documents seconds, ordered positive-duration windows, reachable bone and optional horizontal speed units/default.
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
