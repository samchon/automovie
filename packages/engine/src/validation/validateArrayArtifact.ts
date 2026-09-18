import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { violation } from "./violation";
import { pushViolation } from "./pushViolation";

/**
 * Validate an artifact array and append a typed violation on mismatch.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateArrayArtifact` rejects a collection-shaped artifact field that is not an array at its declared member path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateArrayArtifact` preserves the offending collection value beside the array-shape expectation used by downstream element validation.
 */
export const validateArrayArtifact = (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): value is unknown[] => {
  if (Array.isArray(value)) return true;
  pushViolation(violations, "type", path, `${label} must be an array`, value);
  return false;
};
