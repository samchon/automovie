import { type IAutoMovieValidation } from "@automovie/interface";

/** Count failed validation violations; successful validation has zero violations. */
export function violationCount(v: IAutoMovieValidation): number {
  return v.success === true ? 0 : v.violations.length;
}
