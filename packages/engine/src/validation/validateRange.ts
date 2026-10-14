import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Require a finite numeric actual value between independently configured open/closed endpoints.
 *
 * @evidence contracts/common.md#principled-implementation Require a finite numeric actual value between independently configured open/closed endpoints.
 * @evidence contracts/common.md#clear-and-simple-design Artifact owners supply endpoint policy while this helper owns numeric admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Infinity may be an upper bound but never an accepted actual value; invalid inputs are not clamped.
 * @evidence contracts/common.md#meaningful-documentation inclusiveMin/inclusiveMax independently control boundary admission and default true.
 * @evidence contracts/performance.md#efficient-algorithms Constant scalar comparisons plus failure text require bounded work.
 * @evidence contracts/performance.md#reuse-equivalent-work Clip/shot/camera fields share this predicate without sharing append effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned violation rows remain; no scalar history or resource is retained.
 */
export const validateRange: (value: unknown, path: string, min: number, max: number, label: string, violations: IAutoMovieConstraintViolation[], inclusiveMin?: boolean, inclusiveMax?: boolean) => void = (
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
  const belowMax: boolean = max === Infinity ? true :
    inclusiveMax ? numeric <= max : numeric < max;
  if (!Number.isFinite(numeric) || !aboveMin || !belowMax)
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
