import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Require a shallow object and finite x/y/z components, appending each bad axis.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Require a shallow object and finite x/y/z components, appending each bad axis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure validateObjectArtifact owns record shape while Number.isFinite owns actual scalar admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It does not normalize the vector or impose a length/direction meaning.
 * @evidence contracts/development/common.md#meaningful-documentation Object refusal stops field access; axis paths and actual values identify faults.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three finite checks use constant work apart from diagnostic text.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All vector artifact callers reuse this exact finite-axis rule.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only caller-owned fault rows remain, with no vector cache or native handle.
 */
export const validateVectorArtifact: (
  vector: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
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
