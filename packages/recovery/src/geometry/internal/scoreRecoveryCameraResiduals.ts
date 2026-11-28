import type { IAutoMovieRecoveryCameraResidualsScoreOperation } from "@automovie/interface";

/*
 * Collect finite absolute residuals within an inclusive pixel threshold.
 * Returned indices preserve observation order; quantiles use linear
 * interpolation at (N-1)*q. Empty support has null diagnostics, never a perfect
 * zero error.
 */
export function scoreRecoveryCameraResiduals(
  residuals: Parameters<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>[0],
  thresholdPx: Parameters<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> {
  if (!Number.isFinite(thresholdPx) || !(thresholdPx > 0))
    throw new Error("camera-score: finite positive pixel threshold required");
  const indices: number[] = [],
    values: number[] = [];
  for (let at: number = 0; at < residuals.length; at++) {
    const residual: number | null = residuals[at]!;
    if (
      residual !== null &&
      Number.isFinite(residual) &&
      Math.abs(residual) <= thresholdPx
    ) {
      indices.push(at);
      values.push(Math.abs(residual));
    }
  }
  values.sort((a: number, b: number): number => a - b);
  if (values.length === 0) return { indices, medianPx: null, p90Px: null };
  const medianAt: number = (values.length - 1) / 2,
    p90At: number = 0.9 * (values.length - 1);
  const medianLower: number = Math.floor(medianAt),
    p90Lower: number = Math.floor(p90At);
  return {
    indices,
    medianPx:
      values[medianLower]! +
      (values[Math.ceil(medianAt)]! - values[medianLower]!) *
        (medianAt - medianLower),
    p90Px:
      values[p90Lower]! +
      (values[Math.ceil(p90At)]! - values[p90Lower]!) * (p90At - p90Lower),
  };
}
