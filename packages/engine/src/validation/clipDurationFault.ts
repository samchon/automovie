import type { IAutoMovieClipShapeFault } from "@automovie/interface";

/**
 * Return the first sampler-duration fault or null for finite nonnegative
 * seconds.
 */
export const clipDurationFault: (
  duration: number,
) => IAutoMovieClipShapeFault | null = (
  duration: number,
): IAutoMovieClipShapeFault | null => {
  if (!Number.isFinite(duration))
    return {
      kind: "range",
      field: "duration",
      message: `duration must be finite, but was ${duration}`,
      value: duration,
    };
  if (duration < 0)
    return {
      kind: "range",
      field: "duration",
      message: `duration must be non-negative, but was ${duration}`,
      value: duration,
    };
  return null;
};
