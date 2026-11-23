import type { IAutoMovieViolationCollector } from "@automovie/interface";

/**
 * Reject nonfinite values and values below the supplied inclusive minimum, appending the caller's range path.
 */
export const finiteMinimum: (
  value: number,
  minimum: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number,
  minimum: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (!Number.isFinite(value) || value < minimum)
    collector.push(
      "range",
      path,
      `${label} must be finite and >= ${minimum}`,
      value,
    );
};
