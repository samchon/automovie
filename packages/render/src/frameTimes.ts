import { countEncodedFrames } from "./timing/internal/countEncodedFrames.js";

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
  return Array.from(
    { length: countEncodedFrames(fps, durationSeconds) },
    (_: unknown, index: number): number => index / fps,
  );
}
