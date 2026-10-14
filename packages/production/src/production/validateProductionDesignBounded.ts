import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report nonfinite or out-of-inclusive-bound scalars under the supplied declared limits.
 *
 * @evidence contracts/common.md#principled-implementation Number.isFinite and inclusive lower/upper comparisons append one range finding for a nonfinite or out-of-range value. Scalar, vector, crop, dressing and effect callers supply ordered numeric bounds in the addressed field's units; the helper does not validate those bounds independently.
 * @evidence contracts/common.md#clear-and-simple-design One scalar rule supplies the vector/range wrappers and direct field gates while the shared sink owns diagnostic construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value is clamped or replaced and no consumer changes inclusivity; Number.EPSILON bounds are explicit caller policy rather than a tolerance inferred here.
 * @evidence contracts/common.md#meaningful-documentation Documents finite inclusive admission, caller-owned units/bounds and appending to the borrowed diagnostic array without changing the value or returning a verdict.
 * @evidence contracts/performance.md#efficient-algorithms Fixed numeric comparisons and optional message construction use constant scalar state.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied scalar and interval is compared directly; this stateless rule coordinates no cached or pending operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one new finding and its field/bound correction text enter the borrowed diagnostic array; its caller owns retention, with no descriptor or task acquired here.
 */
export const validateProductionDesignBounded: (diagnostics: IAutoMovieDiagnostic[], value: number, min: number, max: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: number,
  min: number,
  max: number,
  target: string,
  file: string,
  field: string,
): void => {
  if (Number.isFinite(value) === false || value < min || value > max)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `${field} must be a finite value from ${min} through ${max}. Fix ${field} in its design setter.`,
    );
};
