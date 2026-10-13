import { pushViolation, validateObjectArtifact, validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Collect shape, finite range and played-span errors for a sequence trim in seconds. A known finite shot duration bounds start plus duration; a missing shot is refused by the sequence owner and supplies no duration bound here.
 */
export const validateTrim = (
  trim: unknown,
  shotDuration: number,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateObjectArtifact(trim, path, "sequence trim", violations)) return;
  validateRange(
    trim.start,
    `${path}.start`,
    0,
    Infinity,
    "trim start",
    violations,
  );
  validateRange(
    trim.duration,
    `${path}.duration`,
    0,
    Infinity,
    "trim duration",
    violations,
    false,
  );
  const start = typeof trim.start === "number" ? trim.start : NaN;
  const duration = typeof trim.duration === "number" ? trim.duration : NaN;
  if (
    Number.isFinite(shotDuration) &&
    Number.isFinite(start) &&
    Number.isFinite(duration) &&
    start + duration > shotDuration
  )
    pushViolation(
      violations,
      "temporal",
      path,
      `trim start + duration must fit within shot duration ${shotDuration}`,
      trim,
    );
};
