import type { IAutoMovieViolationCollector } from "@automovie/interface";

/**
 * Append identity findings for nonstrings and whitespace-only strings.
 */
export const collectNonEmptyId: (
  value: unknown,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: unknown,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (typeof value !== "string") {
    collector.push("type", path, `${label} must be a string`, value);
    return;
  }
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be a non-empty id`, value);
};
