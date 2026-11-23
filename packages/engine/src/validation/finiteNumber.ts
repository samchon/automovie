import type { IAutoMovieViolationCollector } from "@automovie/interface";

/**
 * Require a finite scalar while preserving either sign for fields such as
 * normal scale.
 */
export const finiteNumber: (
  value: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (!Number.isFinite(value))
    collector.push("range", path, `${label} must be finite`, value);
};
