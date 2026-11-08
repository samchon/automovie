/**
 * The review interval and speed a URL requests, read only after the source's
 * available range is known: missing bounds select the available range and
 * speed 1, while an empty, nonfinite or out-of-range value refuses instead
 * of being clamped.
 *
 * @param params The URL's search parameters `start`, `end` and `speed`.
 * @param available The available range, seconds.
 * @param speeds Supported speeds; 0.25, 0.5 and 1 by default.
 * @returns The interval and speed.
 */
export function readAutoMovieReviewInterval(
  params: URLSearchParams,
  available: readonly [number, number],
  speeds: readonly number[] = [0.25, 0.5, 1],
): { start: number; end: number; speed: number } {
  const read = (name: string, fallback: number): number => {
    const text: string | null = params.get(name);
    if (text !== null && !text.trim())
      throw new Error(`URL ${name} must contain a number`);
    const value: number = text === null ? fallback : Number(text);
    if (!Number.isFinite(value)) throw new Error(`URL ${name} must be finite`);
    return value;
  };
  const start: number = read("start", available[0]);
  const end: number = read("end", available[1]);
  const speed: number = read("speed", 1);
  if (
    !speeds.includes(speed) ||
    start < available[0] ||
    end > available[1] ||
    start >= end
  )
    throw new Error(
      `URL requires ${available[0]} <= start < end <= ${available[1]} and a speed of ${speeds.join(", ")}`,
    );
  return { start, end, speed };
}
