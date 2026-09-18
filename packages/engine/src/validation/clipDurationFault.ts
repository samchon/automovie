import { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";

/**
 * A clip's duration as the sampler requires it: finite and non-negative.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `clipDurationFault` refuses a clip whose duration is not a finite non-negative number.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `clipDurationFault` returns the observed duration with the time-domain constraint required by key sampling.
 */
export const clipDurationFault = (
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
