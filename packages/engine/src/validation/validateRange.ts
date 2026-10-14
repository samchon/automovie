import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { describeInvalidValue } from "./describeInvalidValue";
import { pushViolation } from "./pushViolation";

/**
 * Require a finite numeric actual value between independently configured open/closed endpoints.
 *
 * Both endpoints default to inclusive. Infinite bounds are permitted, but the tested value must be a finite number and is never coerced into one. Refusals retain the authored value; failed string conversion produces `an uninspectable value` only in the explanatory text.
 *
 * @evidence contracts/common.md#principled-implementation Narrows unknown input by typeof before finite and open/closed numeric comparisons, then appends a range finding through pushViolation; diagnostic-only string conversion cannot turn a malformed value into an admitted number or replace a finding with a conversion exception.
 * @evidence contracts/common.md#clear-and-simple-design Artifact owners supply endpoint policy while this helper owns numeric admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Infinity may be an upper bound but never an accepted actual value; invalid inputs are not clamped.
 * @evidence contracts/common.md#meaningful-documentation Gives inclusive endpoint defaults, finite numeric admission, infinite-bound support and the text-only conversion fallback with original-value retention.
 * @evidence contracts/performance.md#efficient-algorithms Scalar comparisons take constant work; failure text grows with its label and representation, and user-defined conversion hooks have no execution-time bound.
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
        ? `${label} must be finite and ${inclusiveMin ? ">=" : ">"} ${min}, but was ${describeInvalidValue(value)}`
        : `${label} must be finite and within ${inclusiveMin ? "[" : "("}${min}, ${max}${inclusiveMax ? "]" : ")"}, but was ${describeInvalidValue(value)}`,
      value,
    );
};
