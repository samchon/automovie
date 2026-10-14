import { validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

import { builtConnectorTestLevels as levels } from "./builtConnectorTestLevels";

/** Validate a fresh level graph after the caller's mutation and return violation paths in validator order.
 *
 * The connector unit and its refusal part supply the expected paths independently. An accepted graph returns an empty list; this projection preserves every emitted violation path without asserting diagnostic messages, count or order itself. Mutation exceptions propagate. This synchronous internal helper registers no case, retains no graph between calls and starts no process, renderer or native build.
 *
 * @param mutate Existing case mutation applied once to a fresh authored levels graph.
 * @returns All emitted paths, or an empty array on success.
 */
export const builtConnectorTestRefusalPaths: (
  mutate: (value: IAutoMovieBuiltEnvironment) => void,
) => string[] = (
  mutate: (value: IAutoMovieBuiltEnvironment) => void,
): string[] => {
  const value: IAutoMovieBuiltEnvironment = levels();
  mutate(value);
  const validation: IAutoMovieValidation = validateBuiltEnvironment({
    environment: value,
  });
  return validation.success === true
    ? []
    : validation.violations.map(
        (violation: IAutoMovieConstraintViolation): string => violation.path,
      );
};
