import { type IAutoMovieValidation } from "@automovie/interface";

import { reportValidation } from "./reportValidation";
/** Preserve validation evidence when its warning count differs from the expectation. */
export function validationHasWarningCount(
  context: string,
  validation: IAutoMovieValidation,
  expected: number,
): boolean {
  const matches: boolean =
    validation.success === true &&
    (validation.warnings ?? []).length === expected;
  if (matches === false) reportValidation(context, validation);
  return matches;
}
