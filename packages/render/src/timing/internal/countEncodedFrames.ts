/**
 * Count whole frames on the encoded grid by rounding the requested duration to
 * the nearest frame. Unusable clocks produce zero frames and a count outside
 * the safe integer range throws.
 *
 * @param fps The frame rate in frames per second.
 * @param durationSeconds The requested running time in seconds.
 * @returns The number of frames the encoder samples.
 */
export function countEncodedFrames(
  fps: number,
  durationSeconds: number,
): number {
  if (
    !Number.isFinite(fps) ||
    fps <= 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  )
    return 0;

  const count: number = Math.round(durationSeconds * fps);
  if (!Number.isSafeInteger(count))
    throw new RangeError("The encoded frame count must be a safe integer");
  return count;
}
