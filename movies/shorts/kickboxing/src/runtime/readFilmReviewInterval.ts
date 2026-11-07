/** Resolve exact URL requests only after source availability is known. Missing bounds select the available interval; explicit out-of-range values refuse without clamping. */
export function readFilmReviewInterval(
  params: URLSearchParams,
  available: readonly [number, number],
): { start: number; end: number; speed: number } {
  /** Reject empty and nonfinite query values instead of silently adopting zero. */
  function seconds(name: string, fallback: number): number {
    const text: string | null = params.get(name);
    if (text !== null && !text.trim())
      throw new Error(`URL ${name} must contain seconds`);
    const value: number = text === null ? fallback : Number(text);
    if (!Number.isFinite(value)) throw new Error(`URL ${name} must be finite`);
    return value;
  }
  const start: number = seconds("start", available[0]);
  const end: number = seconds("end", available[1]);
  const speed: number = seconds("speed", 1);
  if (
    ![0.25, 0.5, 1].includes(speed) ||
    start < available[0] ||
    end > available[1] ||
    start >= end
  )
    throw new Error(
      `URL requires ${available[0]} <= start < end <= ${available[1]} and speed .25, .5 or 1`,
    );
  return { start, end, speed };
}
