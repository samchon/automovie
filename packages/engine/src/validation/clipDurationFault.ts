import type { IAutoMovieClipShapeFault } from "@automovie/interface";

/**
 * Return the first sampler-duration fault or null for finite nonnegative
 * seconds.
 */
export const clipDurationFault: (
  duration: unknown,
) => IAutoMovieClipShapeFault | null = (
  duration: unknown,
): IAutoMovieClipShapeFault | null => {
  if (typeof duration !== "number" || !Number.isFinite(duration))
    return {
      kind: "range",
      field: "duration",
      message: `duration must be finite, but was ${String(duration)}`,
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
