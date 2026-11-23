import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Require Array.isArray and append a type fault for every other top-level
 * shape.
 */
export const validateArrayArtifact: (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => value is unknown[] = (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): value is unknown[] => {
  if (Array.isArray(value)) return true;
  pushViolation(violations, "type", path, `${label} must be an array`, value);
  return false;
};
