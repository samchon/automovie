/**
 * Admit a finite seek time and clamp it to the closed production interval.
 * Duration is positive finite seconds; invalid inputs throw before placement.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Math.max and Math.min clamp a finite seek time to the closed interval from zero to the duration; seconds and duration share one timebase, and nonfinite seconds or a nonpositive or nonfinite duration throw before any placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure function holds the bounds; the Viewer seek and redraw completion in main.ts both import it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither bound is a tuned value: zero and the authored duration are the interval's ends, and no caller or time is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the admitted inputs, the closed interval and the throw on invalid input.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two comparisons and two finiteness checks cost constant time per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call computes from its two numbers alone; there is no shared work to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is allocated or retained.
 */
export function clampProductionSeconds(
  seconds: number,
  duration: number,
): number {
  if (!Number.isFinite(seconds)) throw new Error("Seek seconds must be finite");
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error("Production duration must be positive and finite");
  return Math.max(0, Math.min(duration, seconds));
}
