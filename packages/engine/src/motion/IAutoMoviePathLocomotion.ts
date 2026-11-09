import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMoviePathFrame } from "./IAutoMoviePathFrame";

/**
 * A gait baked along an authored XZ path, with its per-keyframe baseline frames.
 * Whole-cycle snapping determines duration and effective speed; ground Y and
 * gait bob do not contribute to the reported horizontal length.
 *
 * @evidence contracts/development/design.md#principled-representation Reports the non-looping repeated gait, one baseline frame per emitted keyframe and the horizontal arc length, effective speed and positive whole-cycle count used by followPathMotion to finish exactly at the path end.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps derived travel accounting beside the baked motion, allowing callers to inspect the snap instead of recomputing it from requested pace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The speed field states actual length over snapped duration, not the caller's requested pace when whole-cycle rounding changes it.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes horizontal length from ground elevation and bob, gives speed units and states frame/keyframe correspondence and whole-cycle snapping.
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
