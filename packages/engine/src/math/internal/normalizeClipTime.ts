/**
 * Clamp or wrap seconds into the clip duration. A nonpositive duration reads at
 * zero.
 */
export function normalizeClipTime(
  seconds: number,
  duration: number,
  loop: boolean,
): number {
  if (duration <= 0) return 0;
  if (loop) {
    const remainder: number = seconds % duration;
    return remainder < 0 ? remainder + duration : remainder;
  }
  return Math.min(duration, Math.max(0, seconds));
}
