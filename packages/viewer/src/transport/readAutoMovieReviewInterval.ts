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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The review interval and speed a URL requests, read only after the source's available range is known: missing bounds select the available range and speed 1, while an empty, nonfinite or out-of-range value refuses instead of being clamped) and documents parameters `params`, `available`, `speeds`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The review interval and speed a URL requests, read only after the source's available range is known: missing bounds select the available range and speed 1, while an empty, nonfinite or out-of-range value refuses instead of being clamped) directly over its typed inputs (`params`, `available`, `speeds`) as a fixed number of statements with no loop or recursion in the body, delegating to `params.get`, `text.trim`, `Number`, `Number.isFinite`, `read`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 23 lines and 6 top-level statements that reuses `params.get`, `text.trim`, `Number`, `Number.isFinite`, `read` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `params`, `available`, `speeds`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
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
