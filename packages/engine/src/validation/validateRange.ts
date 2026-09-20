import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { pushViolation } from "./pushViolation";

/**
 * Validate a finite numeric value against a configurable interval.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateRange` rejects a non-finite or out-of-interval artifact scalar at the supplied numeric field path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateRange` records the observed scalar together with its inclusive or exclusive lower-bound contract and upper limit.
 */
export const validateRange = (
  value: unknown,
  path: string,
  min: number,
  max: number,
  label: string,
  violations: IAutoMovieConstraintViolation[],
  inclusiveMin = true,
): void => {
  const numeric = typeof value === "number" ? value : NaN;
  const aboveMin = inclusiveMin ? numeric >= min : numeric > min;
  const belowMax = max === Infinity ? true : numeric <= max;
  if (!Number.isFinite(numeric) || !aboveMin || !belowMax)
    pushViolation(
      violations,
      "range",
      path,
      max === Infinity
        ? `${label} must be finite and ${inclusiveMin ? ">=" : ">"} ${min}, but was ${value}`
        : `${label} must be finite and within ${inclusiveMin ? "[" : "("}${min}, ${max}], but was ${value}`,
      value,
    );
};
