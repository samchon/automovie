import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * Wrap a violation list into an {@link IAutoMovieValidation}. Any
 * `"error"`-severity violation fails the run (and the whole list, warnings
 * included, rides along for the correction round); a list of only `"warning"`s
 * still succeeds but surfaces them; an empty list is a clean success.
 */
export const toValidation = (
  violations: IAutoMovieConstraintViolation[],
): IAutoMovieValidation => {
  if (violations.some((v) => v.severity === "error"))
    return { success: false, violations };
  if (violations.length > 0) return { success: true, warnings: violations };
  return { success: true };
};
