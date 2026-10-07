import { validateBuiltEnvironment } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { builtConnectorTestLevels as levels } from "./builtConnectorTestLevels";


/** The violation paths one mutation of the level graph produces. */
export const builtConnectorTestRefusalPaths = (
  mutate: (value: IAutoMovieBuiltEnvironment) => void,
): string[] => {
  const value = levels();
  mutate(value);
  const validation = validateBuiltEnvironment({ environment: value });
  return validation.success === true
    ? []
    : validation.violations.map((violation) => violation.path);
};
