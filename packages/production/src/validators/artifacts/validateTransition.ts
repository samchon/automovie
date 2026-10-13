import { validateObjectArtifact, validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Collect shape and strictly positive finite duration errors for one incoming transition in seconds. Its fit against adjacent played spans belongs to the sequence validator.
 */
export const validateTransition = (
  transition: unknown,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (
    !validateObjectArtifact(transition, path, "sequence transition", violations)
  )
    return;
  validateRange(
    transition.duration,
    `${path}.duration`,
    0,
    Infinity,
    "transition duration",
    violations,
    false,
  );
};
