import { type IAutoMovieValidation } from "@automovie/interface";

import { reportValidation } from "./reportValidation";

/** Preserve validation evidence when no warning was produced on a successful result. */
export function validationHasWarnings(
  context: string,
  validation: IAutoMovieValidation,
): boolean {
  const matches: boolean =
    validation.success === true && (validation.warnings ?? []).length > 0;
  if (matches === false) reportValidation(context, validation);
  return matches;
}
