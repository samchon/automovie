import { validateBuiltEnvironment } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { builtConnectorOperationTestRuns as runs } from "./builtConnectorOperationTestRuns";


/** The violation paths one mutation of the moving work produces. */
export const builtConnectorOperationTestRefusalPaths = (
  mutate: (value: IAutoMovieBuiltEnvironment) => void,
): string[] => {
  const value = runs();
  mutate(value);
  const validation = validateBuiltEnvironment({ environment: value });
  return validation.success === true
    ? []
    : validation.violations.map((violation) => violation.path);
};
