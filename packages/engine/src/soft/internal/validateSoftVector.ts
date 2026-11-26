import {
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateSoftNumeric as numeric } from "./validateSoftNumeric";

/**
 * Validate three authored vector components through the shared finite-scalar
 * policy.
 */
export function validateSoftVector(
  out: IAutoMovieViolationCollector,
  path: string,
  value: IAutoMovieVector3,
): void {
  for (const axis of ["x", "y", "z"] as const)
    numeric(
      out,
      `${path}.${axis}`,
      `${axis} component`,
      value[axis],
      -Infinity,
      false,
      Infinity,
    );
}
