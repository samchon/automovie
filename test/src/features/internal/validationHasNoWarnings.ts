import { type IAutoMovieValidation } from "@automovie/interface";

import { reportValidation } from "./reportValidation";

/** Preserve positive validation evidence when the result is unsuccessful or carries warnings. */
export function validationHasNoWarnings(
  context: string,
  validation: IAutoMovieValidation,
): boolean {
  const clean: boolean =
    validation.success === true && (validation.warnings ?? []).length === 0;
  if (clean === false) reportValidation(context, validation);
  return clean;
}
