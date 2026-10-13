import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";

/** Validate an artifact object and append a typed violation on mismatch. */
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
