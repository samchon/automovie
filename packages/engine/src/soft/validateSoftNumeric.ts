import type { IAutoMovieViolationCollector } from "@automovie/interface";

/**
 * Append a range violation for a non-finite scalar or an open/closed interval
 * failure.
 */
export const validateSoftNumeric: (
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  exclusive: boolean,
  max: number,
) => void = (
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  exclusive: boolean,
  max: number,
): void => {
  if ((exclusive ? value <= min : value < min) || value > max)
    out.push(
      "range",
      path,
      `${label} must be finite within ${exclusive ? "(" : "["}${min}, ${max}]`,
      value,
    );
};
