import type { IAutoMovieClipShapeFault } from "@automovie/interface";

/** Return the first sampler-duration fault or null for nonnegative seconds. */
export const clipDurationFault: (
  duration: number,
) => IAutoMovieClipShapeFault | null = (
  duration: number,
): IAutoMovieClipShapeFault | null => {
  if (duration < 0)
    return {
      kind: "range",
      field: "duration",
      message: `duration must be non-negative, but was ${duration}`,
      value: duration,
    };
  return null;
};
