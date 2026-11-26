import { AutoMovieEngineArchitecture } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { builtOpeningTestPartition as partition } from "./builtOpeningTestPartition";

/** The violation paths one mutation of the partition produces. */
export const builtOpeningTestRefusalPaths = (
  mutate: (value: IAutoMovieBuiltEnvironment) => void,
): string[] => {
  const value = partition();
  mutate(value);
  const validation = AutoMovieEngineArchitecture.validateBuiltEnvironment({ environment: value });
  return validation.success === true
    ? []
    : validation.violations.map((violation) => violation.path);
};
