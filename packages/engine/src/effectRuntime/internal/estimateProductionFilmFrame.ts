import { IAutoMovieProductionFrameRate } from "@automovie/interface";

/**
 * Estimate a frame from the float product, or `null` when it cannot be exact.
 *
 * The product `seconds * numerator / denominator`, rounded by the caller's
 * `round` and clamped at zero, only starts the search; callers settle the frame
 * by the exact boundary comparison the sampler performs. Two frames of headroom
 * below `Number.MAX_SAFE_INTEGER` keep that correction inside the safe-integer
 * range, and an infinite or NaN product fails the comparison and is reported as
 * unrepresentable.
 */
export const estimateProductionFilmFrame = (
  seconds: number,
  frameRate: IAutoMovieProductionFrameRate,
  round: (value: number) => number,
): number | null => {
  const frame: number = Math.max(
    0,
    round((seconds * frameRate.numerator) / frameRate.denominator),
  );
  return frame <= Number.MAX_SAFE_INTEGER - 2 ? frame : null;
};
