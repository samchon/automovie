import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMoviePathFrame } from "./IAutoMoviePathFrame";

/**
 * A gait baked along a path, plus the per-keyframe path frames, mirroring how
 * the ground-IK pass returns its plants (#596).
 *
 * @author Samchon
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
