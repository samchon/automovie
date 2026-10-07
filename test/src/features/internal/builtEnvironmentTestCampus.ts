import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { builtEnvironmentTestBuilding as building } from "./builtEnvironmentTestBuilding";
import { builtEnvironmentTestTransform as transform } from "./builtEnvironmentTestTransform";


/** Two independently placed building units sharing one work. */
export const builtEnvironmentTestCampus = (): IAutoMovieBuiltEnvironment => {
  const value = building();
  value.elements.push({
    id: "annex-root",
    kind: "building",
    parent: null,
    transform: transform(-20, 0, 4),
    model: null,
    space: "annex-space",
  });
  value.spaces.push({
    id: "annex-space",
    kind: "building",
    parent: null,
    cells: [],
  });
  value.buildings.push({
    id: "annex",
    element: "annex-root",
    space: "annex-space",
  });
  return value;
};
