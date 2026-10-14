/**
 * Reproduce the existing test clock: i/rate from zero, with the final value
 * capped at duration and at least two entries for admitted positive inputs.
 * The default is 24 samples/s. Callers supply their existing duration/rate;
 * this helper adds no admission checks and supplies queried times, not an
 * independent interpolation oracle.
 */
export const bakeTimes: (duration: number, sampleRate?: number) => number[] = (
  duration: number,
  sampleRate: number = 24,
): number[] => {
  const frames: number = Math.max(1, Math.ceil(duration * sampleRate));
  return Array.from({ length: frames + 1 }, (_: unknown, index: number): number =>
    Math.min(duration, index / sampleRate),
  );
};
