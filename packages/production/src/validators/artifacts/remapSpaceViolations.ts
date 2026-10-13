import type { IAutoMovieValidation } from "@automovie/interface";

/** Re-root `validateSpace`'s own `$input` paths under the scene's `space`. */
export const remapSpaceViolations = (
  validation: IAutoMovieValidation,
): IAutoMovieValidation =>
  validation.success === false
    ? {
        success: false,
        violations: validation.violations.map((item) => ({
          ...item,
          path: item.path.replace("$input", "$input.space"),
        })),
      }
    : validation;
