import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMoviePathFrame } from "./IAutoMoviePathFrame";

/**
 * A gait baked along an authored XZ path, with its per-keyframe baseline frames.
 * Whole-cycle snapping determines duration and effective speed; ground Y and
 * gait bob do not contribute to the reported horizontal length.
 *
 * @evidence contracts/common.md#principled-implementation Reports the non-looping repeated gait, one baseline frame per emitted keyframe and the horizontal arc length, effective speed and positive whole-cycle count used by followPathMotion to finish exactly at the path end.
 * @evidence contracts/common.md#clear-and-simple-design Keeps derived travel accounting beside the baked motion, allowing callers to inspect the snap instead of recomputing it from requested pace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The speed field states actual length over snapped duration, not the caller's requested pace when whole-cycle rounding changes it.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes horizontal length from ground elevation and bob, gives speed units and states frame/keyframe correspondence and whole-cycle snapping.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These result fields do not choose path traversal or repeat allocation; the path baker owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stored baseline frames avoid consumer re-derivation at authored bake times, without a result cache for changed waypoints or gait data.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned motion keyframes and baseline frames grow together with cycle count times gait keyframes; the caller owns both arrays.
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
