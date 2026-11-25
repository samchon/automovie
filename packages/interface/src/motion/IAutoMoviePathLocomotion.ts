import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMoviePathFrame } from "./IAutoMoviePathFrame";

/**
 * A gait baked along an authored XZ path, with its per-keyframe baseline
 * frames. Whole-cycle snapping determines duration and effective speed; ground
 * Y and gait bob do not contribute to the reported horizontal length.
 */
export interface IAutoMoviePathLocomotion {
  /** The baked non-looping clip. */
  motion: IAutoMovieMotion;

  /** One path frame per output keyframe, in time order. */
  frames: IAutoMoviePathFrame[];

  /** Total horizontal (XZ) arc length of the path, meters. */
  length: number;

  /** Effective speed after cycle snapping, m/s (`length / duration`). */
  speed: number;

  /** Whole gait cycles baked. */
  cycles: number;
}
