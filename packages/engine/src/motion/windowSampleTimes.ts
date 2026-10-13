/** The sampling grid over `[start, end]`, see the module contract. */
export const windowSampleTimes = (
  start: number,
  end: number,
  sampleRate: number,
): number[] => {
  const frames = Math.max(1, Math.ceil((end - start) * sampleRate));
  const times = Array.from({ length: frames + 1 }, (_, index) =>
    Math.min(end, start + index / sampleRate),
  );
  // FP can land (end − start) × rate just above an integer; the extra instant
  // clamps onto `end` and duplicates it, a zero-width segment downstream
  // validators would divide by (#1012).
  if (times.length > 1 && times[times.length - 1] === times[times.length - 2])
    times.pop();
  return times;
};
