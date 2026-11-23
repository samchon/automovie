import type { IAutoMovieCaptureSampling } from "./IAutoMovieCaptureSampling";

/**
 * Subject-local sampling and event windows. planAutoMovieCaptureFrames
 * validates finite positive fps/duration, a nonnegative safe-integer window,
 * and in-range explicit/event/cut seconds. Sampling is already admitted by
 * parseAutoMovieCapturePlanRequest; range rates and ordering are its
 * responsibility. Ordinary range samples stop before to, while explicit
 * instants can include the duration boundary.
 */
export interface IAutoMovieCaptureFramePlanProps {
  /** Running time of the subject in seconds. */
  durationSeconds: number;

  /** Frames per second of the subject's grid. */
  fps: number;

  /** The seconds drawn besides the windows. */
  sampling: IAutoMovieCaptureSampling;

  /** Seconds of the instants the caller named. */
  events: readonly number[];

  /** Seconds of the cuts detected in a file. */
  cuts: readonly number[];

  /** Frames drawn on each side of an event or cut. */
  window: number;
}
