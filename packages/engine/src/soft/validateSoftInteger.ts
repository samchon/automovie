import type { IAutoMovieViolationCollector } from "@automovie/interface";

/** Append a type violation for a value outside a safe-integer interval. */
export const validateSoftInteger: (
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
) => void = (
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
): void => {
  if (
    !(
      value >= min &&
      value <= max &&
      Math.abs(value) <= Number.MAX_SAFE_INTEGER &&
      Math.floor(value) === value
    )
  )
    out.push(
      "type",
      path,
      `${label} must be an integer within [${min}, ${max}]`,
      value,
    );
};
