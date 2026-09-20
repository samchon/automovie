import { IAutoMovieConstraintViolation, IAutoMovieValidation } from "@automovie/interface";

/**
 * Wrap a violation list into an {@link IAutoMovieValidation}. Any
 * `"error"`-severity violation fails the run (and the whole list, warnings
 * included, rides along for the correction round); a list of only `"warning"`s
 * still succeeds but surfaces them; an empty list is a clean success.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `toValidation` retains every located violation while deriving success only from the presence of error severity.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `toValidation` keeps warning-only and empty outcomes distinct without discarding their ordered diagnostic paths.
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-severity-and-outcome `toValidation` derives failure only from error-severity findings while returning warning-only findings on a successful result.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-severity-outcome The result envelope separates each finding's severity from the aggregate success flag and preserves all findings for the caller.
 */
export const toValidation = (
  violations: IAutoMovieConstraintViolation[],
): IAutoMovieValidation => {
  if (violations.some((v) => v.severity === "error"))
    return { success: false, violations };
  if (violations.length > 0) return { success: true, warnings: violations };
  return { success: true };
};
