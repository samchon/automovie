/**
 * Sample a finite ordered seconds window at a finite positive Hz rate, retaining both endpoints and removing an exactly duplicated final instant. A zero-width window returns one instant; the caller owns the new array.
 *
 * @evidence contracts/common.md#principled-implementation Rounds interval count upward, emits start plus index divided by rate clamped to end, and removes the final duplicate caused by binary64 just-above-integer rounding.
 * @evidence contracts/common.md#clear-and-simple-design One function owns shifted and zero-origin sampling clocks; motion and physics callers admit finite ordered windows and positive rates before reaching this arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The final exact-equality removal targets a zero-width duplicate, not a fuzzy coalescing of nearby legitimate samples; malformed quantities are outside the admitted-window premise and no named consumer changes the clock.
 * @evidence contracts/common.md#meaningful-documentation Documents finite ordered seconds, positive Hz, zero width, inclusive endpoints and owned output.
 * @evidence contracts/performance.md#efficient-algorithms For F chosen intervals, construction is O(F) time and space with one constant-time tail check; requested grid size remains caller-controlled with no arbitrary frame cap.
 * @evidence contracts/performance.md#reuse-equivalent-work The interval count is computed once and shared by allocation and generation; sampleTimes delegates here, and no cross-call clock cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the grid and all temporary allocation is invocation-local; no sampling task or external resource is retained.
 */
export const windowSampleTimes: (start: number, end: number, sampleRate: number) => number [ ] = (
  start: number,
  end: number,
  sampleRate: number,
): number[] => {
  const frames: number = Math.max(1, Math.ceil((end - start) * sampleRate));
  const times: number[] = Array.from({ length: frames + 1 }, (_: unknown, index: number) : number =>
    Math.min(end, start + index / sampleRate),
  );
  // FP can land (end − start) × rate just above an integer; the extra instant
  // clamps onto `end` and duplicates it, a zero-width segment downstream
  // validators would divide by (#1012).
  if (times.length > 1 && times[times.length - 1] === times[times.length - 2])
    times.pop();
  return times;
};
