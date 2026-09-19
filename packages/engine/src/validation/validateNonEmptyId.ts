import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { pushViolation } from "./pushViolation";

/**
 * Validate that an artifact id is a non-empty string.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateNonEmptyId` rejects non-string and blank artifact identities at the id field that supplied them.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateNonEmptyId` retains the observed id value while enforcing the non-empty structural identity constraint.
 */
export const validateNonEmptyId = (
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
