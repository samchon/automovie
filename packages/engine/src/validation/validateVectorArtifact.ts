import type {
  IAutoMovieConstraintViolation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/** Require finite x/y/z components, appending each bad axis. */
export const validateVectorArtifact: (
  vector: IAutoMovieVector3,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  vector: IAutoMovieVector3,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
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
