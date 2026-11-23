/**
 * Sample a finite ordered seconds window at a finite positive Hz rate,
 * retaining both endpoints and removing an exactly duplicated final instant. A
 * zero-width window returns one instant; the caller owns the new array.
 */
export const windowSampleTimes: (
  start: number,
  end: number,
  sampleRate: number,
) => number[] = (start: number, end: number, sampleRate: number): number[] => {
  const frames: number = Math.max(1, Math.ceil((end - start) * sampleRate));
  const times: number[] = Array.from(
    { length: frames + 1 },
    (_: unknown, index: number): number =>
      Math.min(end, start + index / sampleRate),
  );
  // FP can land (end − start) × rate just above an integer; the extra instant
  // clamps onto `end` and duplicates it, a zero-width segment downstream
  // validators would divide by (#1012).
  if (times.length > 1 && times[times.length - 1] === times[times.length - 2])
    times.pop();
  return times;
};
