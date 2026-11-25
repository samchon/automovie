import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Declare a foot that should remain planted over a sampled motion interval. */
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
