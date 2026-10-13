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
 *
 * @evidence contracts/common.md#principled-implementation IEEE 754 division is correctly rounded, so `i / fps` is a pure function of its operands on every conforming host, while accumulating `1 / fps` would compound rounding error per frame; the frame count rounds to the nearest whole frame because a render can only deliver whole frames.
 * @evidence contracts/common.md#clear-and-simple-design The single render, the sequence render plan, the caption plan, the pose-keypoint plan and the playground all sample through this one schedule, so captions, keypoints and pixels address the same frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid clocks return an empty schedule rather than a guessed one, and no rate or duration is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the frame count and instant formulas with their units, why the instants are reproducible, and which inputs yield no frames.
 * @evidence contracts/performance.md#efficient-algorithms Time and space are O(N) in the frame count, one division per frame, which is the size of the schedule returned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each plan builds its schedule once per call, and the arithmetic is cheaper than keying a cache by rate and duration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned array of N numbers is the caller's and nothing else is retained; N is bounded only by the caller's duration and rate, and a count past the engine's array limit throws a `RangeError`.
 * @author Samchon
 */
export const frameTimes = (fps: number, durationSeconds: number): number[] => {
  if (
    Number.isFinite(fps) === false ||
    Number.isFinite(durationSeconds) === false ||
    fps <= 0 ||
    durationSeconds <= 0
  )
    return [];
  const count: number = Math.round(durationSeconds * fps);
  return Array.from(
    { length: count },
    (_: unknown, index: number): number => index / fps,
  );
};
