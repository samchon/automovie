import type { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/*
 * Require a finite value between independently configured open/closed
 * endpoints.
 *
 * Both endpoints default to inclusive. Infinite bounds are permitted, but the
 * tested value must be finite. Refusals retain the authored value.
 */
export const validateRange: (
  value: number,
  path: string,
  min: number,
  max: number,
  label: string,
  violations: IAutoMovieConstraintViolation[],
  inclusiveMin?: boolean,
  inclusiveMax?: boolean,
) => void = (
  value: number,
  path: string,
  min: number,
  max: number,
  label: string,
  violations: IAutoMovieConstraintViolation[],
  inclusiveMin: boolean = true,
  inclusiveMax: boolean = true,
): void => {
  const aboveMin: boolean = inclusiveMin ? value >= min : value > min;
  const belowMax: boolean =
    max === Infinity ? true : inclusiveMax ? value <= max : value < max;
  if (!aboveMin || !belowMax)
    pushViolation(
      violations,
      "range",
      path,
      max === Infinity
        ? `${label} must be finite and ${inclusiveMin ? ">=" : ">"} ${min}, but was ${value}`
        : `${label} must be finite and within ${inclusiveMin ? "[" : "("}${min}, ${max}${inclusiveMax ? "]" : ")"}, but was ${value}`,
      value,
    );
};
