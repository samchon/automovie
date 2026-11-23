import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";

/**
 * Require the shallow non-null non-array object shape and append a labeled type
 * fault otherwise.
 */
export const validateObjectArtifact: (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => value is Record<string, unknown> = (
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
