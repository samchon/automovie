import {
  type AutoMovieViolationKind,
  type IAutoMovieValidation,
} from "@automovie/interface";

import { hasWarning } from "./hasWarning";
import { reportValidation } from "./reportValidation";

/** Preserve the complete observed validation when an expected warning is absent. */
export function validationHasWarning(
  context: string,
  validation: IAutoMovieValidation,
  kind: AutoMovieViolationKind,
  pathIncludes: string,
): boolean {
  const matches: boolean = hasWarning(validation, kind, pathIncludes);
  if (matches === false) reportValidation(context, validation);
  return matches;
}
