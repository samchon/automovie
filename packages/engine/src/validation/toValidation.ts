import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * Return failure with the supplied violation array when any error exists,
 * otherwise return the same array as warnings or an empty success record.
 */
export const toValidation: (
  violations: IAutoMovieConstraintViolation[],
) => IAutoMovieValidation = (
  violations: IAutoMovieConstraintViolation[],
): IAutoMovieValidation => {
  if (
    violations.some(
      (v: IAutoMovieConstraintViolation): boolean => v.severity === "error",
    )
  )
    return { success: false, violations };
  if (violations.length > 0) return { success: true, warnings: violations };
  return { success: true };
};
