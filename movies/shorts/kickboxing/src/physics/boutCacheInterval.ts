/** Find the containing cache interval without shifting a native timestamp. Exact reconstructed grid times retain their own frame, including absolute archive offsets; a genuine interior measurement belongs to the following frame. */
export function boutCacheInterval(
  seconds: number,
  startSeconds: number,
  rate: number,
): number {
  const nearest: number = Math.round((seconds - startSeconds) * rate);
  return seconds === startSeconds + nearest / rate
    ? nearest
    : Math.ceil((seconds - startSeconds) * rate);
}
