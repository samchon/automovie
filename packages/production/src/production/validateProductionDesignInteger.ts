import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report values outside the supplied inclusive integer interval.
 *
 * @evidence contracts/common.md#principled-implementation Number.isInteger plus inclusive bounds reports one range finding for fractional, nonfinite or out-of-range fields. Capacity, seed, raster and effect callers supply ordered bounds; safe integer identity follows only when those bounds exclude larger represented integers.
 * @evidence contracts/common.md#clear-and-simple-design One integer interval rule serves declared counts and indexes while each caller retains its domain-specific limits and the shared sink constructs findings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rounding, truncation, clamping or substituted count repairs an invalid input; actual caller bounds rather than fixture expectations decide the interval.
 * @evidence contracts/common.md#meaningful-documentation States inclusive integer admission, caller-owned bounds and appended range diagnostics without mutation or a boolean result.
 * @evidence contracts/performance.md#efficient-algorithms Fixed integer/range checks and optional message construction take constant scalar work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current scalar and caller bounds are checked directly; no cached or pending operation is coordinated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one finding and bound/field correction string enter the caller-owned array; no scalar history, descriptor or task is retained here.
 */
export const validateProductionDesignInteger: (diagnostics: IAutoMovieDiagnostic[], value: number, min: number, max: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: number,
  min: number,
  max: number,
  target: string,
  file: string,
  field: string,
): void => {
  if (Number.isInteger(value) === false || value < min || value > max)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `${field} must be an integer from ${min} through ${max}. Fix ${field} in its design setter.`,
    );
};
