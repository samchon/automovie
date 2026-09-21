import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";

/**
 * Validate an artifact object and append a typed violation on mismatch.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateObjectArtifact` rejects a non-record geometry member at the caller-supplied artifact path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateObjectArtifact` records the observed non-object value and the required JSON-object constraint before nested checks continue.
 */
export const validateObjectArtifact = (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): value is Record<string, unknown> => {
  if (isRecord(value)) return true;
  pushViolation(
    violations,
    "type",
    path,
    `${label} must be a JSON object`,
    value,
  );
  return false;
};
