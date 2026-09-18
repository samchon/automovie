import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { pushViolation } from "./pushViolation";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Validate a finite three-component vector artifact.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateVectorArtifact` rejects each non-finite coordinate at its own x, y, or z member path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateVectorArtifact` first proves object shape, then records the offending component value for finite-vector validation.
 */
export const validateVectorArtifact = (
  vector: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateObjectArtifact(vector, path, label, violations)) return;
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(vector[axis]))
      pushViolation(
        violations,
        "range",
        `${path}.${axis}`,
        `${label} component must be finite, but was ${vector[axis]}`,
        vector[axis],
      );
};
