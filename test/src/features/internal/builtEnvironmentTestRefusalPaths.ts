import { validateBuiltEnvironment } from "@automovie/engine";
import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { builtEnvironmentTestBuilding as building } from "./builtEnvironmentTestBuilding";


/**
 * The exact violation paths one mutation produces, so a refusal is pinned to
 * the field the author wrote rather than to "something failed".
 */
export const builtEnvironmentTestRefusalPaths = (
  mutate: (value: IAutoMovieBuiltEnvironment) => void,
): string[] => {
  const value = building();
  mutate(value);
  const validation = validateBuiltEnvironment({ environment: value });
  return validation.success === true
    ? []
    : validation.violations.map((violation) => violation.path);
};
