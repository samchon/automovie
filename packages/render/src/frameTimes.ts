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
export const frameTimes: (fps: number, durationSeconds: number) => number[] = (
  fps: number,
  durationSeconds: number,
): number[] => {
  if (fps <= 0 || durationSeconds <= 0) return [];
  const count: number = Math.round(durationSeconds * fps);
  return Array.from(
    { length: count },
    (_: unknown, index: number): number => index / fps,
  );
};
