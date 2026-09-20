import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { violation } from "./violation";

/**
 * Record one violation into a collector the caller owns.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `pushViolation` appends one geometry-shape failure without losing the path chosen by the check that discovered it.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `pushViolation` binds kind, expected constraint, and observed value into the caller's ordered artifact diagnostics.
 */
export const pushViolation = (
  violations: IAutoMovieConstraintViolation[],
  kind: IAutoMovieConstraintViolation["kind"],
  path: string,
  expected: string,
  value: unknown,
): void => {
  violations.push(violation(kind, path, expected, value));
};
