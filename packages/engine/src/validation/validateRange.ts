import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { describeInvalidValue } from "./describeInvalidValue";
import { pushViolation } from "./pushViolation";

/**
 * Require a finite numeric actual value between independently configured open/closed endpoints.
 *
 * Both endpoints default to inclusive. Infinite bounds are permitted, but the tested value must be a finite number and is never coerced into one. Refusals retain the authored value; failed string conversion produces `an uninspectable value` only in the explanatory text.
 */
export const validateRange: (
  value: unknown,
  path: string,
  min: number,
  max: number,
  label: string,
  violations: IAutoMovieConstraintViolation[],
  inclusiveMin?: boolean,
  inclusiveMax?: boolean,
) => void = (
  value: unknown,
  path: string,
  min: number,
  max: number,
  label: string,
  violations: IAutoMovieConstraintViolation[],
  inclusiveMin: boolean = true,
  inclusiveMax: boolean = true,
): void => {
  const numeric: number = typeof value === "number" ? value : NaN;
  const aboveMin: boolean = inclusiveMin ? numeric >= min : numeric > min;
  const belowMax: boolean =
    max === Infinity ? true : inclusiveMax ? numeric <= max : numeric < max;
  if (!Number.isFinite(numeric) || !aboveMin || !belowMax)
    pushViolation(
      violations,
      "range",
      path,
      max === Infinity
        ? `${label} must be finite and ${inclusiveMin ? ">=" : ">"} ${min}, but was ${describeInvalidValue(value)}`
        : `${label} must be finite and within ${inclusiveMin ? "[" : "("}${min}, ${max}${inclusiveMax ? "]" : ")"}, but was ${describeInvalidValue(value)}`,
      value,
    );
};
