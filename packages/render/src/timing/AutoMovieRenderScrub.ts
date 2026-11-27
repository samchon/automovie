import { frameTimes as frameTimesImplementation } from "../internal/frameTimes";
import { type IAutoMoviePlanViewerFrameTimesRequest } from "@automovie/interface";
import { planViewerFrameTimes as planViewerFrameTimesImplementation } from "../internal/planViewerFrameTimes";

/** Public operations for Auto Movie Render Scrub. */
export namespace AutoMovieRenderScrub {
  /**
   * The capture instants, in seconds, of a clip of `durationSeconds` sampled at
   * `fps` frames per second.
   *
   * The schedule has `N = round(durationSeconds * fps)` frames at `t = i / fps`
   * for `i` from 0 to `N - 1`. Each instant is one IEEE division of the frame
   * index, never a running sum, so the same spec yields the same instants on
   * every machine; that reproducibility is what separates a deterministic render
   * from a stochastic diffusion video. A non-finite or non-positive `fps` or
   * duration, or a duration shorter than half a frame, yields no frames.
   */
  export function frameTimes(fps: number, durationSeconds: number): number[] {
    return frameTimesImplementation(fps, durationSeconds);
  }

  /**
   * Plan the film seconds whose frames a still capture writes.
   *
   * Give either explicit `at` seconds, or a `from`–`to` range sampled every
   * `every` frames or every `step` seconds. Range samples are aligned to the
   * encoded frame grid at `fps`, so each still matches a frame the video encodes;
   * explicit seconds are kept as given. The result is sorted, without repeats,
   * and every second lies in `[0, durationSeconds]`.
   */
  export function planViewerFrameTimes(request: IAutoMoviePlanViewerFrameTimesRequest): number[] {
    return planViewerFrameTimesImplementation(request);
  }
}
