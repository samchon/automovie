import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Require a string with at least one non-whitespace code unit and append a type fault otherwise.
 */
export const validateNonEmptyId: (
  id: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  id: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (typeof id !== "string") {
    pushViolation(violations, "type", path, `${label} must be a string`, id);
    return;
  }
  if (id.trim().length === 0)
    pushViolation(
      violations,
      "type",
      path,
      `${label} must be a non-empty id`,
      id,
    );
};
